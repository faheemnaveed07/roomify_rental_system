"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Amenity = exports.PropertyStatus = exports.PropertyType = void 0;
var PropertyType;
(function (PropertyType) {
    PropertyType["SHARED_ROOM"] = "shared_room";
    PropertyType["FULL_HOUSE"] = "full_house";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["PENDING_VERIFICATION"] = "pending_verification";
    PropertyStatus["ACTIVE"] = "active";
    PropertyStatus["RENTED"] = "rented";
    PropertyStatus["INACTIVE"] = "inactive";
    PropertyStatus["REJECTED"] = "rejected";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
var Amenity;
(function (Amenity) {
    Amenity["WIFI"] = "wifi";
    Amenity["AC"] = "ac";
    Amenity["HEATING"] = "heating";
    Amenity["PARKING"] = "parking";
    Amenity["LAUNDRY"] = "laundry";
    Amenity["GYM"] = "gym";
    Amenity["POOL"] = "pool";
    Amenity["SECURITY"] = "security";
    Amenity["CCTV"] = "cctv";
    Amenity["GENERATOR"] = "generator";
    Amenity["WATER_TANK"] = "water_tank";
    Amenity["ELEVATOR"] = "elevator";
    Amenity["BALCONY"] = "balcony";
    Amenity["GARDEN"] = "garden";
    Amenity["ROOFTOP"] = "rooftop";
    Amenity["SERVANT_QUARTER"] = "servant_quarter";
    Amenity["CABLE_TV"] = "cable_tv";
    Amenity["INTERCOM"] = "intercom";
})(Amenity || (exports.Amenity = Amenity = {}));
//# sourceMappingURL=property.types.js.map