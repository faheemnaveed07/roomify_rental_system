import React from 'react';
import { ArrowLeft, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PropertyUploadForm from '../components/organisms/PropertyUploadForm';
import { verificationService } from '../services/api';

const AddProperty: React.FC = () => {
    const navigate = useNavigate();
    const [isSuccess, setIsSuccess] = React.useState(false);

    // Listing is gated on verification server-side; check up front so the
    // landlord gets a clear next step instead of a rejected submit.
    const [verified, setVerified] = React.useState<boolean | null>(null);
    React.useEffect(() => {
        verificationService
            .getStatus()
            .then((s) => setVerified(s.fullyVerified))
            // If the check itself fails, don't block — the server still enforces it.
            .catch(() => setVerified(true));
    }, []);

    if (verified === null) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" />
            </div>
        );
    }

    if (verified === false) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                    <ShieldAlert size={40} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-[#1E293B]">Verification required</h1>
                    <p className="mt-2 font-medium text-neutral-500">
                        To keep Domavi trustworthy, you need a verified email and CNIC before you can list a
                        property.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/verify')}
                    className="rounded-2xl bg-[#2563EB] px-8 py-3 font-bold text-white transition-all hover:opacity-90"
                >
                    Get verified
                </button>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle size={48} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-[#1E293B]">Listing Submitted!</h1>
                    <p className="text-neutral-500 mt-2 font-medium">
                        Your property is being verified by our team. You can track its status in the dashboard.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/properties')}
                    className="px-8 py-3 bg-[#1E293B] text-white rounded-2xl font-bold hover:bg-black transition-all"
                >
                    Return to My Properties
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-neutral-500 hover:text-[#2563EB] transition-colors font-bold"
            >
                <ArrowLeft size={20} />
                Back to Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-[#1E293B]">Post New Property</h1>
                    <p className="text-neutral-500 mt-1 font-medium italic">Reach thousands of potential renters in Punjab.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-neutral-100">
                <PropertyUploadForm onSuccess={() => setIsSuccess(true)} />
            </div>
        </div>
    );
};

export default AddProperty;
