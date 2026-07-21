import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Agreement, IAgreementDocument } from '../models/Agreement';
import { Booking, BookingStatus } from '../models/Booking';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { sendEmail } from '../utils/email';
import { emitAgreementNotification } from '../config/socket';
import { logger } from '../utils/logger';

interface IUserPopulated {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cnicNumber?: string;
}

interface IPropertyPopulated {
    _id: mongoose.Types.ObjectId;
    title: string;
    location: {
        address: string;
        city: string;
        area: string;
        postalCode?: string;
    };
    propertyType: string;
    rules?: {
        petsAllowed: boolean;
        smokingAllowed: boolean;
        visitorsAllowed: boolean;
        additionalRules: string[];
    };
}

const ensureAgreementsDir = () => {
    const dir = path.join(process.cwd(), 'uploads', 'agreements');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
};

const formatDate = (date: Date): string =>
    new Date(date).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

const formatCurrency = (amount: number, currency = 'PKR'): string =>
    `${currency} ${amount.toLocaleString('en-PK')}`;

const generatePDF = async (data: {
    bookingId: string;
    tenant: IUserPopulated;
    landlord: IUserPopulated;
    property: IPropertyPopulated;
    monthlyRent: number;
    securityDeposit: number;
    currency: string;
    moveInDate: Date;
    durationValue: number;
    durationUnit: string;
    bookingType: string;
    agreementDate: Date;
    outputPath: string;
}): Promise<void> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 60, size: 'A4' });
        const stream = fs.createWriteStream(data.outputPath);

        doc.pipe(stream);

        // ── Header ────────────────────────────────────────────────────────
        doc.fontSize(20).font('Helvetica-Bold').text('DOMAVI', { align: 'center' });
        doc.fontSize(14).font('Helvetica').text('Residential Lease Agreement', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#666666').text(`Agreement Date: ${formatDate(data.agreementDate)}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(1);

        // ── Agreement Reference ───────────────────────────────────────────
        doc.fillColor('#000000').fontSize(9).font('Helvetica').text(`Booking Reference: ${data.bookingId}`, { align: 'right' });
        doc.moveDown(1);

        // ── Section helper ────────────────────────────────────────────────
        const sectionTitle = (title: string) => {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text(title);
            doc.moveDown(0.3);
        };

        const fieldRow = (label: string, value: string) => {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#444444').text(`${label}: `, { continued: true });
            doc.font('Helvetica').fillColor('#000000').text(value || '—');
        };

        // ── Parties ───────────────────────────────────────────────────────
        sectionTitle('1. PARTIES');

        doc.fontSize(10).font('Helvetica-Bold').text('LANDLORD (Lessor)');
        doc.moveDown(0.2);
        fieldRow('Full Name', `${data.landlord.firstName} ${data.landlord.lastName}`);
        fieldRow('Email', data.landlord.email);
        fieldRow('Phone', data.landlord.phone || '—');
        doc.moveDown(0.8);

        doc.fontSize(10).font('Helvetica-Bold').text('TENANT (Lessee)');
        doc.moveDown(0.2);
        fieldRow('Full Name', `${data.tenant.firstName} ${data.tenant.lastName}`);
        fieldRow('Email', data.tenant.email);
        fieldRow('Phone', data.tenant.phone || '—');
        fieldRow('CNIC', data.tenant.cnicNumber || '—');
        doc.moveDown(1);

        // ── Property ──────────────────────────────────────────────────────
        sectionTitle('2. LEASED PROPERTY');
        fieldRow('Property', data.property.title);
        fieldRow(
            'Address',
            [data.property.location.address, data.property.location.area, data.property.location.city, data.property.location.postalCode]
                .filter(Boolean)
                .join(', ')
        );
        fieldRow('Property Type', data.bookingType === 'SHARED_ROOM_BED' ? 'Shared Room (Bed)' : 'Full Property');
        doc.moveDown(1);

        // ── Lease Terms ───────────────────────────────────────────────────
        sectionTitle('3. LEASE TERMS');
        fieldRow('Move-In Date', formatDate(data.moveInDate));
        fieldRow('Lease Duration', `${data.durationValue} ${data.durationUnit}`);
        fieldRow('Monthly Rent', formatCurrency(data.monthlyRent, data.currency));
        fieldRow('Security Deposit', formatCurrency(data.securityDeposit, data.currency));
        fieldRow('Total Payable (first month + deposit)', formatCurrency(data.monthlyRent + data.securityDeposit, data.currency));
        doc.moveDown(1);

        // ── Rules ─────────────────────────────────────────────────────────
        sectionTitle('4. PROPERTY RULES');
        if (data.property.rules) {
            const r = data.property.rules;
            fieldRow('Pets Allowed', r.petsAllowed ? 'Yes' : 'No');
            fieldRow('Smoking Allowed', r.smokingAllowed ? 'Yes' : 'No');
            fieldRow('Visitors Allowed', r.visitorsAllowed ? 'Yes' : 'No');
            if (r.additionalRules && r.additionalRules.length > 0) {
                doc.moveDown(0.4);
                doc.fontSize(10).font('Helvetica-Bold').text('Additional Rules:');
                r.additionalRules.forEach((rule) => {
                    doc.fontSize(10).font('Helvetica').text(`  • ${rule}`);
                });
            }
        } else {
            doc.fontSize(10).font('Helvetica').text('No specific rules provided.');
        }
        doc.moveDown(1);

        // ── Standard Terms ────────────────────────────────────────────────
        sectionTitle('5. STANDARD TERMS & CONDITIONS');
        const terms = [
            'The Tenant shall pay the monthly rent on or before the 5th day of each calendar month.',
            'The security deposit shall be refunded within 30 days of the lease end, subject to deductions for damages beyond normal wear and tear.',
            'The Tenant shall maintain the property in a clean and habitable condition.',
            'The Tenant shall not sublet or assign the property without prior written consent of the Landlord.',
            'Either party may terminate the lease with 30 days written notice unless otherwise agreed.',
            'The Landlord shall ensure the property remains in a habitable condition and carry out necessary repairs promptly.',
            'Any disputes arising from this agreement shall be resolved through mutual negotiation; failing which, through appropriate legal channels.',
            'This agreement is governed by the applicable laws of Pakistan.',
        ];
        terms.forEach((term, i) => {
            doc.fontSize(9).font('Helvetica').fillColor('#333333').text(`${i + 1}. ${term}`, {
                paragraphGap: 4,
            });
        });
        doc.moveDown(1);

        // ── Signatures ────────────────────────────────────────────────────
        sectionTitle('6. SIGNATURES');
        doc.fontSize(9).fillColor('#555555').text(
            'By accessing and downloading this agreement, both parties acknowledge and accept its terms.'
        );
        doc.moveDown(1.5);

        const sigY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('LANDLORD', 60, sigY);
        doc.fontSize(10).font('Helvetica-Bold').text('TENANT', 350, sigY);

        doc.moveDown(2);
        doc.moveTo(60, doc.y).lineTo(250, doc.y).stroke();
        doc.moveTo(350, doc.y).lineTo(535, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#444444').text(`${data.landlord.firstName} ${data.landlord.lastName}`, 60);
        doc.text(`${data.tenant.firstName} ${data.tenant.lastName}`, 350, doc.y - doc.currentLineHeight());

        // ── Footer ────────────────────────────────────────────────────────
        doc.moveDown(2);
        doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(0.5);
        doc.fontSize(8).fillColor('#999999').text(
            `Generated by Domavi on ${formatDate(data.agreementDate)} | This is a system-generated document.`,
            { align: 'center' }
        );

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
    });
};

class AgreementService {
    /**
     * Generate a lease agreement PDF for a completed booking.
     * Only allowed when booking.status === COMPLETED.
     * Prevents duplicate: one agreement per booking.
     */
    /**
     * @param isAdmin the caller acts for the platform, not as a party to the
     *   booking. Admin payment approval generates the agreement on the parties'
     *   behalf, and the party check below would otherwise reject it — quietly,
     *   since the caller only logs the failure.
     */
    async generateAgreement(
        bookingId: string,
        requesterId: string,
        isAdmin = false
    ): Promise<IAgreementDocument> {
        // Check for existing agreement first
        const existing = await Agreement.findOne({ booking: new mongoose.Types.ObjectId(bookingId) });
        if (existing) {
            throw new Error('An agreement has already been generated for this booking');
        }

        const booking = await Booking.findById(bookingId)
            .populate<{ tenant: IUserPopulated }>('tenant', 'firstName lastName email phone cnicNumber')
            .populate<{ landlord: IUserPopulated }>('landlord', 'firstName lastName email phone')
            .populate<{ property: IPropertyPopulated }>('property', 'title location propertyType rules');

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Authorization: only tenant or landlord of the booking
        const tenantId = booking.tenant._id.toString();
        const landlordId = booking.landlord._id.toString();
        if (!isAdmin && requesterId !== tenantId && requesterId !== landlordId) {
            throw new Error('Unauthorized: You are not a party to this booking');
        }

        if (booking.status !== BookingStatus.COMPLETED) {
            throw new Error('Agreement can only be generated for completed bookings');
        }

        const agreementsDir = ensureAgreementsDir();
        const filename = `agreement-${bookingId}-${Date.now()}.pdf`;
        const outputPath = path.join(agreementsDir, filename);
        const pdfUrl = `/uploads/agreements/${filename}`;

        await generatePDF({
            bookingId,
            tenant: booking.tenant,
            landlord: booking.landlord,
            property: booking.property,
            monthlyRent: booking.rentDetails?.monthlyRent ?? 0,
            securityDeposit: booking.rentDetails?.securityDeposit ?? 0,
            currency: booking.rentDetails?.currency ?? 'PKR',
            moveInDate: booking.proposedMoveInDate,
            durationValue: booking.proposedDuration?.value ?? 0,
            durationUnit: booking.proposedDuration?.unit ?? 'months',
            bookingType: booking.bookingType,
            agreementDate: new Date(),
            outputPath,
        });

        const agreement = await Agreement.create({
            booking: new mongoose.Types.ObjectId(bookingId),
            tenant: new mongoose.Types.ObjectId(tenantId),
            landlord: new mongoose.Types.ObjectId(landlordId),
            property: booking.property._id,
            status: 'generated',
            pdfPath: outputPath,
            pdfUrl,
        });

        logger.info(`Agreement generated for booking ${bookingId}: ${filename}`);
        return agreement;
    }

    /**
     * Get agreement by booking ID. Only accessible by tenant, landlord, or admin.
     */
    async getAgreementByBooking(bookingId: string, userId: string, isAdmin = false): Promise<IAgreementDocument | null> {
        const agreement = await Agreement.findOne({
            booking: new mongoose.Types.ObjectId(bookingId),
        });

        if (!agreement) return null;

        if (!isAdmin) {
            const tenantId = agreement.tenant.toString();
            const landlordId = agreement.landlord.toString();
            if (userId !== tenantId && userId !== landlordId) {
                throw new Error('Unauthorized');
            }
        }

        return agreement;
    }

    /**
     * Get agreement by its own ID. Only accessible by tenant, landlord, or admin.
     */
    async getAgreementById(agreementId: string, userId: string, isAdmin = false): Promise<IAgreementDocument | null> {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) return null;

        if (!isAdmin) {
            if (userId !== agreement.tenant.toString() && userId !== agreement.landlord.toString()) {
                throw new Error('Unauthorized');
            }
        }

        return agreement;
    }

    /**
     * List all agreements where the given user is the landlord, most recent
     * first, with property + tenant populated so the dashboard can render a
     * "review & sign" card without extra round-trips.
     *
     * Powers the landlord "Awaiting your signature" section: the frontend
     * treats an agreement as awaiting the landlord when `tenantSignedAt` is set
     * but `landlordSignedAt` is not. `booking` stays as the raw id, which the
     * UI uses to navigate to /agreement/:bookingId.
     */
    async getLandlordAgreements(landlordId: string): Promise<IAgreementDocument[]> {
        return Agreement.find({ landlord: new mongoose.Types.ObjectId(landlordId) })
            .populate('property', 'title location')
            .populate('tenant', 'firstName lastName email')
            .sort({ createdAt: -1 });
    }

    /**
     * Mark agreement as signed by the requesting user (tenant or landlord).
     */
    async markAsSigned(agreementId: string, userId: string): Promise<IAgreementDocument> {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) {
            throw new Error('Agreement not found');
        }

        const isTenant = agreement.tenant.toString() === userId;
        const isLandlord = agreement.landlord.toString() === userId;

        if (!isTenant && !isLandlord) {
            throw new Error('Unauthorized');
        }

        const tenantJustSigned = isTenant && !agreement.tenantSignedAt;
        const landlordJustSigned = isLandlord && !agreement.landlordSignedAt;

        if (tenantJustSigned) {
            agreement.tenantSignedAt = new Date();
        }
        if (landlordJustSigned) {
            agreement.landlordSignedAt = new Date();
        }

        const fullyExecuted = Boolean(agreement.tenantSignedAt && agreement.landlordSignedAt);
        if (fullyExecuted) {
            agreement.status = 'signed';
        }

        await agreement.save();
        logger.info(`Agreement ${agreementId} signed by user ${userId}`);

        // Fire-and-forget: a socket/email hiccup must never fail the signature.
        if (tenantJustSigned || landlordJustSigned) {
            this.notifyAfterSign(agreement, { tenantJustSigned, fullyExecuted }).catch((err) =>
                logger.error('Agreement sign notification failed', err as Error)
            );
        }

        return agreement;
    }

    /**
     * Notify the relevant parties after a signature.
     * - Tenant just signed (not yet executed) -> tell the landlord to countersign.
     * - Fully executed -> tell both parties the lease is complete.
     * Socket events drive the in-app toast/badge; email is the durable fallback.
     */
    private async notifyAfterSign(
        agreement: IAgreementDocument,
        state: { tenantJustSigned: boolean; fullyExecuted: boolean }
    ): Promise<void> {
        const [tenant, landlord, property] = await Promise.all([
            User.findById(agreement.tenant).select('firstName lastName email'),
            User.findById(agreement.landlord).select('firstName lastName email'),
            Property.findById(agreement.property).select('title'),
        ]);

        const propertyTitle = property?.title ?? 'your property';
        const bookingId = agreement.booking.toString();
        const agreementId = String(agreement._id);
        const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}`.trim() : 'The tenant';

        const emailTasks: Promise<unknown>[] = [];

        if (state.fullyExecuted) {
            const payload = { agreementId, bookingId, propertyTitle, status: 'signed' as const };
            emitAgreementNotification(agreement.tenant.toString(), 'agreement:executed', payload);
            emitAgreementNotification(agreement.landlord.toString(), 'agreement:executed', payload);

            if (tenant?.email) {
                emailTasks.push(sendEmail({
                    to: tenant.email,
                    subject: 'Your Domavi lease is fully signed',
                    html: `<p>Hi ${tenant.firstName || 'there'},</p><p>Your lease agreement for <strong>${propertyTitle}</strong> has been signed by both parties and is now fully executed. You can download the signed copy from your bookings.</p>`,
                    text: `Your lease agreement for ${propertyTitle} is now fully executed.`,
                }));
            }
            if (landlord?.email) {
                emailTasks.push(sendEmail({
                    to: landlord.email,
                    subject: 'Lease fully signed on Domavi',
                    html: `<p>Hi ${landlord.firstName || 'there'},</p><p>The lease agreement for <strong>${propertyTitle}</strong> has been signed by both parties and is now fully executed.</p>`,
                    text: `The lease agreement for ${propertyTitle} is now fully executed.`,
                }));
            }
        } else if (state.tenantJustSigned) {
            // Tenant signed; landlord needs to countersign.
            emitAgreementNotification(agreement.landlord.toString(), 'agreement:awaiting-signature', {
                agreementId,
                bookingId,
                propertyTitle,
                tenantName,
            });

            if (landlord?.email) {
                emailTasks.push(sendEmail({
                    to: landlord.email,
                    subject: 'Action needed: countersign your Domavi lease',
                    html: `<p>Hi ${landlord.firstName || 'there'},</p><p>${tenantName} has signed the lease agreement for <strong>${propertyTitle}</strong>. Please review and countersign it to finalize the lease.</p><p>Open your dashboard and go to <strong>Awaiting your signature</strong>.</p>`,
                    text: `${tenantName} signed the lease for ${propertyTitle}. Please countersign to finalize.`,
                }));
            }
        }

        await Promise.all(emailTasks);
    }
}

export default new AgreementService();
