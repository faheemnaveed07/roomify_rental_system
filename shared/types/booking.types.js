"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingType = exports.BookingStatus = void 0;
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["APPROVED"] = "approved";
    BookingStatus["REJECTED"] = "rejected";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["EXPIRED"] = "expired";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var BookingType;
(function (BookingType) {
    BookingType["FULL_PROPERTY"] = "full_property";
    BookingType["SHARED_ROOM_BED"] = "shared_room_bed";
})(BookingType || (exports.BookingType = BookingType = {}));
//# sourceMappingURL=booking.types.js.map