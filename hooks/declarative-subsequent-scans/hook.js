"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.getCascadingScans = exports.handle = void 0;
var lodash_1 = require("lodash");
var Mustache = require("mustache");
var scan_helpers_1 = require("./scan-helpers");
function handle(_a) {
    var scan = _a.scan, getFindings = _a.getFindings;
    return __awaiter(this, void 0, void 0, function () {
        var findings, cascadingRules, cascadingScans, _i, cascadingScans_1, _b, name_1, parameters;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getFindings()];
                case 1:
                    findings = _c.sent();
                    return [4 /*yield*/, getCascadingRules()];
                case 2:
                    cascadingRules = _c.sent();
                    cascadingScans = getCascadingScans(findings, cascadingRules);
                    _i = 0, cascadingScans_1 = cascadingScans;
                    _c.label = 3;
                case 3:
                    if (!(_i < cascadingScans_1.length)) return [3 /*break*/, 6];
                    _b = cascadingScans_1[_i], name_1 = _b.name, parameters = _b.parameters;
                    return [4 /*yield*/, scan_helpers_1.startSubsequentSecureCodeBoxScan({
                            parentScan: scan,
                            scanType: name_1,
                            parameters: parameters
                        })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.handle = handle;
function getCascadingRules() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, scan_helpers_1.getCascadingRulesFromCluster()];
                case 1: 
                // Explicit Cast to the proper Type
                return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Goes thought the Findings and the CascadingRules
 * and returns a List of Scans which should be started based on both.
 */
function getCascadingScans(findings, cascadingRules) {
    var cascadingScans = [];
    for (var _i = 0, cascadingRules_1 = cascadingRules; _i < cascadingRules_1.length; _i++) {
        var cascadingRule = cascadingRules_1[_i];
        var _loop_1 = function (finding) {
            var matches = cascadingRule.spec.matches.some(function (matchesRule) {
                return lodash_1.isMatch(finding, matchesRule);
            });
            if (matches) {
                var _a = cascadingRule.spec.scanSpec, name_2 = _a.name, parameters = _a.parameters;
                cascadingScans.push({
                    name: Mustache.render(name_2, finding),
                    parameters: parameters.map(function (parameter) {
                        return Mustache.render(parameter, finding);
                    })
                });
            }
        };
        for (var _a = 0, findings_1 = findings; _a < findings_1.length; _a++) {
            var finding = findings_1[_a];
            _loop_1(finding);
        }
    }
    return cascadingScans;
}
exports.getCascadingScans = getCascadingScans;
