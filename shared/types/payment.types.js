"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentType = exports.PaymentStatus = exports.PaymentMethod = void 0;
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["SANDBOX"] = "sandbox";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["AWAITING_CONFIRMATION"] = "awaiting_confirmation";
    PaymentStatus["CONFIRMED"] = "confirmed";
    PaymentStatus["REJECTED"] = "rejected";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["SECURITY_DEPOSIT"] = "security_deposit";
    PaymentType["MONTHLY_RENT"] = "monthly_rent";
    PaymentType["ADVANCE_RENT"] = "advance_rent";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
//# sourceMappingURL=payment.types.js.map