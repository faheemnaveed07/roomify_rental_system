"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["TENANT"] = "tenant";
    UserRole["LANDLORD"] = "landlord";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "pending";
    UserStatus["ACTIVE"] = "active";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["DEACTIVATED"] = "deactivated";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
//# sourceMappingURL=user.types.js.map