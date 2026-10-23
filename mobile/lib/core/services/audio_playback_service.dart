// lib/core/services/audio_playback_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Robust, Cached Audio Playback Service for Hebrew & Greek Pronunciations.
// Downloads audio via HTTP client with full desktop headers into local cache,
// then plays directly off disk using local file paths.
// Eliminates ExoPlayer 403 Forbidden errors and provides offline playback for
// previously played words.
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

class AudioPlaybackService {
  AudioPlaybackService._() {
    _init();
  }
  static final AudioPlaybackService instance = AudioPlaybackService._();

  final AudioPlayer _player = AudioPlayer();
  final ValueNotifier<String?> currentlyPlayingKey = ValueNotifier<String?>(null);
  final ValueNotifier<bool> isLoading = ValueNotifier<bool>(false);

  void _init() {
    _player.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) {
        currentlyPlayingKey.value = null;
        isLoading.value = false;
      }
    });
  }

  /// Set of cataloged authentic Strong's entries in the audio repository
  static const Set<String> catalogedStrongsIds = {
    'G11', 'G15', 'G18', 'G25', 'G26', 'G27', 'G32', 'G37', 'G40', 'G50', 'G59', 'G67', 'G68', 'G71', 'G79', 'G80', 'G91', 'G93', 'G114', 'G125', 'G129', 'G142', 'G154', 'G156', 'G165', 'G166', 'G169', 'G173', 'G175', 'G189', 'G190', 'G191', 'G199', 'G203', 'G225', 'G227', 'G228', 'G230', 'G235', 'G240', 'G243', 'G245', 'G260', 'G264', 'G266', 'G268', 'G281', 'G290', 'G305', 'G308', 'G312', 'G314', 'G318', 'G321', 'G337', 'G345', 'G347', 'G350', 'G353', 'G386', 'G391', 'G402', 'G406', 'G417', 'G430', 'G435', 'G436', 'G444', 'G450', 'G455', 'G458', 'G473', 'G490', 'G509', 'G514', 'G518', 'G530', 'G533', 'G537', 'G544', 'G565', 'G570', 'G571', 'G575', 'G591', 'G599', 'G601', 'G602', 'G611', 'G615', 'G622', 'G630', 'G649', 'G652', 'G680', 'G684', 'G686', 'G694', 'G700', 'G706', 'G720', 'G721', 'G726', 'G737', 'G740', 'G744', 'G746', 'G749', 'G756', 'G758', 'G769', 'G770', 'G772', 'G773', 'G782', 'G792', 'G816', 'G837', 'G839', 'G846', 'G859', 'G861', 'G863', 'G868', 'G878', 'G891', 'G906', 'G907', 'G908', 'G910', 'G921', 'G928', 'G932', 'G935', 'G936', 'G941', 'G963', 'G965', 'G966', 'G968', 'G975', 'G979', 'G987', 'G988', 'G991', 'G1012', 'G1014', 'G1033', 'G1056', 'G1060', 'G1062', 'G1063', 'G1067', 'G1074', 'G1080', 'G1085', 'G1089', 'G1092', 'G1093', 'G1096', 'G1097', 'G1100', 'G1107', 'G1108', 'G1110', 'G1118', 'G1119', 'G1121', 'G1122', 'G1124', 'G1125', 'G1127', 'G1131', 'G1135', 'G1138', 'G1139', 'G1140', 'G1154', 'G1161', 'G1162', 'G1163', 'G1166', 'G1173', 'G1176', 'G1186', 'G1188', 'G1189', 'G1194', 'G1198', 'G1199', 'G1208', 'G1209', 'G1210', 'G1220', 'G1223', 'G1228', 'G1242', 'G1247', 'G1248', 'G1249', 'G1252', 'G1256', 'G1260', 'G1261', 'G1263', 'G1271', 'G1299', 'G1302', 'G1303', 'G1308', 'G1319', 'G1320', 'G1321', 'G1322', 'G1325', 'G1330', 'G1342', 'G1343', 'G1344', 'G1350', 'G1352', 'G1360', 'G1372', 'G1377', 'G1380', 'G1381', 'G1388', 'G1391', 'G1392', 'G1398', 'G1401', 'G1404', 'G1410', 'G1411', 'G1415', 'G1417', 'G1427', 'G1431', 'G1432', 'G1435', 'G1437', 'G1438', 'G1448', 'G1451', 'G1453', 'G1473', 'G1484', 'G1485', 'G1487', 'G1492', 'G1494', 'G1496', 'G1504', 'G1510', 'G1515', 'G1519', 'G1520', 'G1525', 'G1531', 'G1534', 'G1535', 'G1537', 'G1538', 'G1540', 'G1543', 'G1544', 'G1563', 'G1564', 'G1565', 'G1567', 'G1577', 'G1581', 'G1586', 'G1588', 'G1605', 'G1607', 'G1614', 'G1623', 'G1632', 'G1636', 'G1646', 'G1651', 'G1653', 'G1654', 'G1656', 'G1657', 'G1658', 'G1672', 'G1679', 'G1680', 'G1683', 'G1684', 'G1702', 'G1715', 'G1722', 'G1743', 'G1746', 'G1752', 'G1754', 'G1763', 'G1781', 'G1782', 'G1785', 'G1799', 'G1803', 'G1821', 'G1831', 'G1832', 'G1839', 'G1849', 'G1854', 'G1859', 'G1860', 'G1861', 'G1868', 'G1869', 'G1870', 'G1887', 'G1893', 'G1899', 'G1905', 'G1909', 'G1911', 'G1921', 'G1922', 'G1934', 'G1937', 'G1939', 'G1941', 'G1949', 'G1961', 'G1968', 'G1987', 'G1992', 'G1994', 'G2007', 'G2008', 'G2010', 'G2032', 'G2033', 'G2036', 'G2038', 'G2040', 'G2041', 'G2046', 'G2048', 'G2064', 'G2065', 'G2068', 'G2078', 'G2081', 'G2087', 'G2089', 'G2090', 'G2092', 'G2094', 'G2097', 'G2098', 'G2106', 'G2112', 'G2127', 'G2129', 'G2147', 'G2150', 'G2165', 'G2168', 'G2169', 'G2181', 'G2186', 'G2190', 'G2192', 'G2193', 'G2198', 'G2199', 'G2205', 'G2212', 'G2222', 'G2226', 'G2227', 'G2228', 'G2232', 'G2233', 'G2235', 'G2240', 'G2243', 'G2246', 'G2248', 'G2249', 'G2250', 'G2254', 'G2264', 'G2268', 'G2281', 'G2288', 'G2296', 'G2300', 'G2307', 'G2309', 'G2310', 'G2316', 'G2323', 'G2325', 'G2326', 'G2334', 'G2342', 'G2344', 'G2346', 'G2347', 'G2348', 'G2359', 'G2362', 'G2364', 'G2372', 'G2374', 'G2378', 'G2379', 'G2380', 'G2384', 'G2385', 'G2390', 'G2398', 'G2400', 'G2409', 'G2411', 'G2414', 'G2419', 'G2424', 'G2425', 'G2440', 'G2443', 'G2446', 'G2449', 'G2453', 'G2455', 'G2462', 'G2464', 'G2474', 'G2476', 'G2478', 'G2480', 'G2486', 'G2491', 'G2495', 'G2501', 'G2504', 'G2509', 'G2511', 'G2513', 'G2518', 'G2521', 'G2523', 'G2525', 'G2531', 'G2532', 'G2540', 'G2541', 'G2542', 'G2549', 'G2556', 'G2560', 'G2564', 'G2573', 'G2574', 'G2584', 'G2586', 'G2588', 'G2590', 'G2596', 'G2597', 'G2605', 'G2617', 'G2618', 'G2632', 'G2638', 'G2641', 'G2647', 'G2657', 'G2658', 'G2673', 'G2675', 'G2716', 'G2722', 'G2723', 'G2730', 'G2744', 'G2746', 'G2749', 'G2753', 'G2756', 'G2768', 'G2770', 'G2776', 'G2784', 'G2798', 'G2799', 'G2806', 'G2808', 'G2812', 'G2813', 'G2816', 'G2817', 'G2818', 'G2819', 'G2821', 'G2822', 'G2825', 'G2836', 'G2837', 'G2840', 'G2842', 'G2872', 'G2873', 'G2889', 'G2896', 'G2902', 'G2904', 'G2909', 'G2917', 'G2919', 'G2920', 'G2923', 'G2927', 'G2928', 'G2936', 'G2937', 'G2962', 'G2967', 'G2968', 'G2974', 'G2976', 'G2980', 'G2983', 'G2992', 'G3000', 'G3004', 'G3022', 'G3027', 'G3029', 'G3037', 'G3042', 'G3049', 'G3056', 'G3062', 'G3076', 'G3077', 'G3087', 'G3088', 'G3089', 'G3094', 'G3101', 'G3107', 'G3109', 'G3113', 'G3115', 'G3122', 'G3123', 'G3129', 'G3137', 'G3140', 'G3141', 'G3142', 'G3144', 'G3162', 'G3173', 'G3195', 'G3196', 'G3198', 'G3303', 'G3306', 'G3307', 'G3309', 'G3313', 'G3319', 'G3326', 'G3340', 'G3341', 'G3342', 'G3358', 'G3360', 'G3361', 'G3366', 'G3367', 'G3371', 'G3376', 'G3379', 'G3384', 'G3398', 'G3404', 'G3408', 'G3415', 'G3419', 'G3421', 'G3431', 'G3440', 'G3441', 'G3464', 'G3466', 'G3474', 'G3475', 'G3478', 'G3480', 'G3483', 'G3485', 'G3498', 'G3501', 'G3507', 'G3516', 'G3521', 'G3522', 'G3528', 'G3539', 'G3543', 'G3551', 'G3554', 'G3563', 'G3566', 'G3568', 'G3570', 'G3571', 'G3581', 'G3583', 'G3586', 'G3588', 'G3598', 'G3599', 'G3606', 'G3614', 'G3617', 'G3618', 'G3619', 'G3624', 'G3625', 'G3631', 'G3641', 'G3650', 'G3660', 'G3661', 'G3664', 'G3666', 'G3670', 'G3686', 'G3694', 'G3699', 'G3700', 'G3704', 'G3708', 'G3709', 'G3725', 'G3735', 'G3739', 'G3745', 'G3748', 'G3752', 'G3753', 'G3754', 'G3756', 'G3757', 'G3759', 'G3761', 'G3762', 'G3763', 'G3765', 'G3767', 'G3768', 'G3772', 'G3775', 'G3777', 'G3778', 'G3779', 'G3780', 'G3784', 'G3788', 'G3789', 'G3793', 'G3798', 'G3804', 'G3811', 'G3813', 'G3814', 'G3816', 'G3820', 'G3825', 'G3842', 'G3844', 'G3850', 'G3853', 'G3854', 'G3860', 'G3862', 'G3870', 'G3874', 'G3880', 'G3900', 'G3908', 'G3916', 'G3918', 'G3928', 'G3930', 'G3933', 'G3936', 'G3952', 'G3954', 'G3956', 'G3957', 'G3958', 'G3962', 'G3972', 'G3973', 'G3982', 'G3983', 'G3985', 'G3986', 'G3992', 'G4002', 'G4008', 'G4012', 'G4016', 'G4017', 'G4022', 'G4043', 'G4052', 'G4053', 'G4059', 'G4061', 'G4066', 'G4071', 'G4073', 'G4074', 'G4077', 'G4091', 'G4095', 'G4098', 'G4100', 'G4102', 'G4103', 'G4105', 'G4106', 'G4121', 'G4127', 'G4128', 'G4130', 'G4133', 'G4137', 'G4138', 'G4139', 'G4143', 'G4145', 'G4149', 'G4151', 'G4152', 'G4159', 'G4160', 'G4164', 'G4166', 'G4169', 'G4171', 'G4172', 'G4178', 'G4183', 'G4190', 'G4198', 'G4202', 'G4204', 'G4214', 'G4215', 'G4218', 'G4219', 'G4221', 'G4222', 'G4226', 'G4228', 'G4229', 'G4232', 'G4238', 'G4240', 'G4245', 'G4250', 'G4253', 'G4254', 'G4263', 'G4286', 'G4301', 'G4314', 'G4327', 'G4328', 'G4334', 'G4335', 'G4336', 'G4337', 'G4341', 'G4352', 'G4355', 'G4369', 'G4374', 'G4383', 'G4394', 'G4395', 'G4396', 'G4404', 'G4412', 'G4413', 'G4434', 'G4440', 'G4442', 'G4453', 'G4459', 'G4461', 'G4464', 'G4487', 'G4491', 'G4506', 'G4514', 'G4521', 'G4523', 'G4531', 'G4537', 'G4559', 'G4561', 'G4567', 'G4569', 'G4570', 'G4572', 'G4578', 'G4592', 'G4594', 'G4610', 'G4613', 'G4621', 'G4624', 'G4625', 'G4632', 'G4633', 'G4653', 'G4655', 'G4672', 'G4678', 'G4680', 'G4687', 'G4690', 'G4697', 'G4710', 'G4714', 'G4716', 'G4717', 'G4735', 'G4741', 'G4750', 'G4757', 'G4762', 'G4771', 'G4773', 'G4808', 'G4815', 'G4851', 'G4862', 'G4863', 'G4864', 'G4892', 'G4893', 'G4904', 'G4905', 'G4920', 'G4972', 'G4973', 'G4982', 'G4983', 'G4990', 'G4991', 'G5007', 'G5013', 'G5015', 'G5035', 'G5037', 'G5038', 'G5040', 'G5043', 'G5046', 'G5048', 'G5055', 'G5056', 'G5057', 'G5059', 'G5062', 'G5064', 'G5067', 'G5083', 'G5087', 'G5088', 'G5091', 'G5092', 'G5093', 'G5095', 'G5100', 'G5101', 'G5103', 'G5108', 'G5111', 'G5117', 'G5118', 'G5119', 'G5132', 'G5140', 'G5143', 'G5151', 'G5154', 'G5160', 'G5177', 'G5179', 'G5180', 'G5185', 'G5198', 'G5204', 'G5207', 'G5217', 'G5218', 'G5219', 'G5225', 'G5228', 'G5257', 'G5259', 'G5266', 'G5273', 'G5278', 'G5281', 'G5290', 'G5293', 'G5302', 'G5310', 'G5312', 'G5315', 'G5316', 'G5319', 'G5330', 'G5339', 'G5342', 'G5343', 'G5346', 'G5357', 'G5360', 'G5368', 'G5376', 'G5384', 'G5399', 'G5401', 'G5426', 'G5429', 'G5438', 'G5442', 'G5443', 'G5449', 'G5455', 'G5456', 'G5457', 'G5461', 'G5463', 'G5479', 'G5480', 'G5483', 'G5485', 'G5486', 'G5495', 'G5499', 'G5503', 'G5505', 'G5506', 'G5507', 'G5519', 'G5526', 'G5528', 'G5532', 'G5547', 'G5550', 'G5552', 'G5557', 'G5560', 'G5561', 'G5564', 'G5565', 'G5574', 'G5578', 'G5590', 'G5599', 'G5602', 'G5610', 'G5613', 'G5615', 'G5616', 'G5618', 'G5620', 'G5623', 'H1', 'H6', 'H14', 'H29', 'H34', 'H40', 'H52', 'H53', 'H54', 'H56', 'H68', 'H74', 'H85', 'H87', 'H113', 'H117', 'H120', 'H121', 'H123', 'H127', 'H134', 'H136', 'H138', 'H157', 'H160', 'H168', 'H175', 'H176', 'H183', 'H188', 'H191', 'H194', 'H197', 'H200', 'H205', 'H212', 'H214', 'H215', 'H216', 'H223', 'H226', 'H227', 'H238', 'H241', 'H251', 'H256', 'H259', 'H268', 'H269', 'H270', 'H271', 'H272', 'H274', 'H281', 'H310', 'H312', 'H314', 'H319', 'H325', 'H335', 'H339', 'H340', 'H341', 'H343', 'H346', 'H347', 'H348', 'H349', 'H352', 'H369', 'H370', 'H374', 'H376', 'H385', 'H389', 'H398', 'H400', 'H402', 'H408', 'H410', 'H413', 'H423', 'H426', 'H428', 'H430', 'H433', 'H441', 'H446', 'H452', 'H477', 'H490', 'H499', 'H505', 'H511', 'H517', 'H518', 'H519', 'H520', 'H530', 'H539', 'H543', 'H550', 'H558', 'H559', 'H561', 'H562', 'H567', 'H571', 'H582', 'H587', 'H589', 'H591', 'H595', 'H609', 'H622', 'H623', 'H631', 'H635', 'H637', 'H639', 'H646', 'H657', 'H658', 'H665', 'H669', 'H676', 'H681', 'H693', 'H697', 'H702', 'H705', 'H713', 'H727', 'H730', 'H734', 'H738', 'H748', 'H753', 'H758', 'H759', 'H769', 'H776', 'H779', 'H784', 'H801', 'H802', 'H804', 'H816', 'H817', 'H834', 'H835', 'H836', 'H842', 'H853', 'H854', 'H855', 'H857', 'H859', 'H860', 'H875', 'H894', 'H898', 'H899', 'H905', 'H906', 'H914', 'H926', 'H929', 'H935', 'H953', 'H954', 'H957', 'H959', 'H962', 'H970', 'H974', 'H977', 'H982', 'H983', 'H990', 'H995', 'H996', 'H998', 'H1004', 'H1008', 'H1058', 'H1060', 'H1065', 'H1077', 'H1097', 'H1100', 'H1101', 'H1104', 'H1107', 'H1109', 'H1111', 'H1115', 'H1116', 'H1121', 'H1129', 'H1130', 'H1137', 'H1141', 'H1144', 'H1157', 'H1162', 'H1167', 'H1168', 'H1197', 'H1201', 'H1215', 'H1219', 'H1234', 'H1237', 'H1241', 'H1242', 'H1245', 'H1247', 'H1250', 'H1254', 'H1258', 'H1263', 'H1270', 'H1272', 'H1280', 'H1285', 'H1288', 'H1293', 'H1310', 'H1314', 'H1316', 'H1319', 'H1320', 'H1322', 'H1323', 'H1324', 'H1330', 'H1346', 'H1347', 'H1350', 'H1361', 'H1364', 'H1366', 'H1368', 'H1369', 'H1387', 'H1389', 'H1390', 'H1391', 'H1396', 'H1397', 'H1406', 'H1410', 'H1416', 'H1419', 'H1423', 'H1431', 'H1436', 'H1439', 'H1471', 'H1473', 'H1481', 'H1486', 'H1497', 'H1513', 'H1516', 'H1523', 'H1530', 'H1537', 'H1540', 'H1544', 'H1548', 'H1567', 'H1568', 'H1571', 'H1580', 'H1581', 'H1588', 'H1589', 'H1590', 'H1612', 'H1616', 'H1637', 'H1644', 'H1648', 'H1653', 'H1661', 'H1692', 'H1696', 'H1697', 'H1698', 'H1706', 'H1709', 'H1715', 'H1722', 'H1730', 'H1732', 'H1755', 'H1767', 'H1777', 'H1800', 'H1817', 'H1818', 'H1819', 'H1820', 'H1823', 'H1826', 'H1832', 'H1834', 'H1835', 'H1847', 'H1859', 'H1869', 'H1870', 'H1875', 'H1881', 'H1892', 'H1909', 'H1926', 'H1931', 'H1933', 'H1934', 'H1935', 'H1942', 'H1945', 'H1952', 'H1961', 'H1964', 'H1980', 'H1984', 'H1992', 'H1993', 'H1995', 'H2001', 'H2005', 'H2008', 'H2009', 'H2015', 'H2022', 'H2026', 'H2029', 'H2030', 'H2040', 'H2063', 'H2074', 'H2076', 'H2077', 'H2088', 'H2091', 'H2094', 'H2100', 'H2102', 'H2114', 'H2132', 'H2142', 'H2143', 'H2145', 'H2146', 'H2148', 'H2154', 'H2167', 'H2181', 'H2195', 'H2199', 'H2201', 'H2204', 'H2205', 'H2216', 'H2219', 'H2220', 'H2226', 'H2232', 'H2233', 'H2236', 'H2244', 'H2254', 'H2256', 'H2266', 'H2275', 'H2280', 'H2282', 'H2296', 'H2308', 'H2315', 'H2319', 'H2320', 'H2340', 'H2342', 'H2344', 'H2346', 'H2347', 'H2351', 'H2354', 'H2371', 'H2372', 'H2377', 'H2388', 'H2389', 'H2396', 'H2398', 'H2400', 'H2403', 'H2406', 'H2416', 'H2421', 'H2428', 'H2436', 'H2438', 'H2450', 'H2451', 'H2459', 'H2461', 'H2470', 'H2472', 'H2483', 'H2486', 'H2490', 'H2491', 'H2493', 'H2498', 'H2502', 'H2504', 'H2505', 'H2506', 'H2513', 'H2518', 'H2530', 'H2534', 'H2543', 'H2549', 'H2550', 'H2555', 'H2563', 'H2568', 'H2572', 'H2574', 'H2580', 'H2583', 'H2595', 'H2600', 'H2603', 'H2608', 'H2617', 'H2620', 'H2623', 'H2637', 'H2654', 'H2656', 'H2658', 'H2659', 'H2671', 'H2672', 'H2674', 'H2677', 'H2682', 'H2689', 'H2691', 'H2706', 'H2708', 'H2713', 'H2719', 'H2720', 'H2723', 'H2729', 'H2734', 'H2740', 'H2742', 'H2763', 'H2764', 'H2778', 'H2781', 'H2790', 'H2796', 'H2803', 'H2809', 'H2820', 'H2822', 'H2833', 'H2850', 'H2856', 'H2859', 'H2865', 'H2876', 'H2885', 'H2889', 'H2891', 'H2893', 'H2896', 'H2919', 'H2930', 'H2931', 'H2932', 'H2945', 'H2962', 'H2963', 'H2975', 'H2977', 'H2983', 'H3001', 'H3021', 'H3026', 'H3027', 'H3034', 'H3045', 'H3050', 'H3051', 'H3058', 'H3059', 'H3060', 'H3063', 'H3064', 'H3068', 'H3077', 'H3079', 'H3083', 'H3088', 'H3091', 'H3092', 'H3097', 'H3100', 'H3104', 'H3117', 'H3119', 'H3123', 'H3130', 'H3147', 'H3157', 'H3162', 'H3169', 'H3176', 'H3187', 'H3190', 'H3196', 'H3198', 'H3201', 'H3205', 'H3206', 'H3212', 'H3213', 'H3220', 'H3225', 'H3233', 'H3240', 'H3243', 'H3245', 'H3254', 'H3256', 'H3259', 'H3276', 'H3282', 'H3289', 'H3290', 'H3293', 'H3303', 'H3308', 'H3312', 'H3316', 'H3318', 'H3320', 'H3323', 'H3327', 'H3332', 'H3335', 'H3341', 'H3368', 'H3372', 'H3373', 'H3374', 'H3379', 'H3381', 'H3383', 'H3384', 'H3389', 'H3390', 'H3394', 'H3405', 'H3407', 'H3409', 'H3411', 'H3414', 'H3423', 'H3426', 'H3427', 'H3442', 'H3444', 'H3448', 'H3458', 'H3467', 'H3468', 'H3470', 'H3474', 'H3477', 'H3478', 'H3485', 'H3489', 'H3490', 'H3498', 'H3499', 'H3513', 'H3515', 'H3518', 'H3519', 'H3526', 'H3532', 'H3541', 'H3547', 'H3548', 'H3556', 'H3557', 'H3559', 'H3563', 'H3568', 'H3577', 'H3581', 'H3582', 'H3588', 'H3603', 'H3605', 'H3611', 'H3612', 'H3615', 'H3618', 'H3627', 'H3629', 'H3639', 'H3644', 'H3651', 'H3658', 'H3665', 'H3667', 'H3669', 'H3671', 'H3678', 'H3680', 'H3684', 'H3701', 'H3702', 'H3707', 'H3709', 'H3715', 'H3722', 'H3727', 'H3738', 'H3742', 'H3754', 'H3760', 'H3766', 'H3772', 'H3778', 'H3782', 'H3789', 'H3791', 'H3801', 'H3802', 'H3807', 'H3808', 'H3809', 'H3812', 'H3820', 'H3824', 'H3830', 'H3837', 'H3844', 'H3845', 'H3847', 'H3863', 'H3871', 'H3878', 'H3881', 'H3885', 'H3887', 'H3895', 'H3898', 'H3899', 'H3915', 'H3920', 'H3923', 'H3925', 'H3947', 'H3950', 'H3956', 'H3957', 'H3966', 'H3967', 'H3971', 'H3972', 'H3985', 'H3988', 'H3996', 'H4013', 'H4022', 'H4026', 'H4039', 'H4043', 'H4046', 'H4054', 'H4057', 'H4058', 'H4060', 'H4066', 'H4069', 'H4080', 'H4082', 'H4100', 'H4116', 'H4118', 'H4124', 'H4131', 'H4135', 'H4148', 'H4150', 'H4159', 'H4170', 'H4186', 'H4191', 'H4194', 'H4196', 'H4217', 'H4219', 'H4229', 'H4256', 'H4264', 'H4279', 'H4283', 'H4284', 'H4294', 'H4296', 'H4306', 'H4310', 'H4318', 'H4321', 'H4325', 'H4327', 'H4334', 'H4347', 'H4353', 'H4376', 'H4390', 'H4392', 'H4393', 'H4397', 'H4399', 'H4405', 'H4417', 'H4421', 'H4422', 'H4427', 'H4428', 'H4436', 'H4437', 'H4438', 'H4467', 'H4480', 'H4496', 'H4501', 'H4503', 'H4513', 'H4519', 'H4522', 'H4541', 'H4549', 'H4553', 'H4557', 'H4578', 'H4581', 'H4583', 'H4591', 'H4592', 'H4598', 'H4599', 'H4601', 'H4603', 'H4604', 'H4605', 'H4609', 'H4611', 'H4616', 'H4631', 'H4639', 'H4641', 'H4643', 'H4672', 'H4676', 'H4682', 'H4687', 'H4692', 'H4708', 'H4713', 'H4714', 'H4720', 'H4725', 'H4726', 'H4733', 'H4735', 'H4744', 'H4751', 'H4758', 'H4775', 'H4782', 'H4784', 'H4791', 'H4801', 'H4805', 'H4813', 'H4818', 'H4820', 'H4847', 'H4853', 'H4872', 'H4886', 'H4888', 'H4899', 'H4900', 'H4904', 'H4908', 'H4910', 'H4912', 'H4918', 'H4931', 'H4932', 'H4940', 'H4941', 'H4948', 'H4960', 'H4962', 'H4970', 'H4994', 'H5002', 'H5003', 'H5006', 'H5012', 'H5019', 'H5022', 'H5027', 'H5028', 'H5030', 'H5035', 'H5037', 'H5038', 'H5045', 'H5046', 'H5048', 'H5057', 'H5060', 'H5061', 'H5062', 'H5065', 'H5066', 'H5071', 'H5074', 'H5079', 'H5080', 'H5087', 'H5088', 'H5090', 'H5104', 'H5116', 'H5117', 'H5126', 'H5127', 'H5128', 'H5130', 'H5137', 'H5146', 'H5148', 'H5157', 'H5158', 'H5159', 'H5162', 'H5174', 'H5175', 'H5178', 'H5186', 'H5193', 'H5203', 'H5207', 'H5216', 'H5221', 'H5234', 'H5237', 'H5254', 'H5258', 'H5262', 'H5265', 'H5271', 'H5275', 'H5281', 'H5288', 'H5291', 'H5307', 'H5315', 'H5321', 'H5324', 'H5331', 'H5337', 'H5341', 'H5347', 'H5352', 'H5355', 'H5358', 'H5375', 'H5381', 'H5387', 'H5397', 'H5401', 'H5404', 'H5410', 'H5414', 'H5416', 'H5422', 'H5428', 'H5437', 'H5439', 'H5462', 'H5467', 'H5475', 'H5483', 'H5488', 'H5492', 'H5493', 'H5503', 'H5511', 'H5514', 'H5516', 'H5518', 'H5521', 'H5542', 'H5545', 'H5553', 'H5560', 'H5564', 'H5592', 'H5594', 'H5608', 'H5612', 'H5631', 'H5633', 'H5641', 'H5643', 'H5645', 'H5647', 'H5648', 'H5650', 'H5656', 'H5662', 'H5668', 'H5674', 'H5676', 'H5678', 'H5680', 'H5695', 'H5699', 'H5703', 'H5704', 'H5707', 'H5712', 'H5715', 'H5716', 'H5739', 'H5747', 'H5749', 'H5750', 'H5766', 'H5769', 'H5771', 'H5774', 'H5775', 'H5782', 'H5785', 'H5787', 'H5794', 'H5795', 'H5797', 'H5800', 'H5804', 'H5818', 'H5826', 'H5828', 'H5830', 'H5833', 'H5838', 'H5850', 'H5857', 'H5867', 'H5869', 'H5879', 'H5892', 'H5921', 'H5923', 'H5927', 'H5930', 'H5941', 'H5945', 'H5953', 'H5971', 'H5973', 'H5975', 'H5982', 'H5983', 'H5998', 'H5999', 'H6002', 'H6010', 'H6025', 'H6030', 'H6031', 'H6035', 'H6040', 'H6041', 'H6051', 'H6083', 'H6086', 'H6098', 'H6099', 'H6106', 'H6113', 'H6138', 'H6153', 'H6160', 'H6172', 'H6186', 'H6187', 'H6189', 'H6203', 'H6212', 'H6213', 'H6215', 'H6223', 'H6224', 'H6227', 'H6231', 'H6235', 'H6239', 'H6240', 'H6242', 'H6256', 'H6258', 'H6285', 'H6293', 'H6297', 'H6299', 'H6310', 'H6311', 'H6327', 'H6342', 'H6343', 'H6370', 'H6372', 'H6381', 'H6403', 'H6412', 'H6419', 'H6430', 'H6435', 'H6437', 'H6438', 'H6440', 'H6442', 'H6453', 'H6456', 'H6459', 'H6466', 'H6467', 'H6471', 'H6475', 'H6485', 'H6490', 'H6499', 'H6504', 'H6505', 'H6509', 'H6510', 'H6522', 'H6524', 'H6525', 'H6529', 'H6532', 'H6539', 'H6547', 'H6555', 'H6565', 'H6566', 'H6571', 'H6578', 'H6584', 'H6586', 'H6588', 'H6597', 'H6601', 'H6605', 'H6607', 'H6629', 'H6635', 'H6643', 'H6659', 'H6662', 'H6663', 'H6664', 'H6666', 'H6667', 'H6672', 'H6677', 'H6680', 'H6685', 'H6696', 'H6697', 'H6721', 'H6722', 'H6726', 'H6738', 'H6743', 'H6757', 'H6763', 'H6779', 'H6793', 'H6810', 'H6817', 'H6822', 'H6823', 'H6828', 'H6833', 'H6845', 'H6862', 'H6865', 'H6869', 'H6870', 'H6879', 'H6883', 'H6884', 'H6887', 'H6908', 'H6912', 'H6913', 'H6918', 'H6921', 'H6922', 'H6924', 'H6942', 'H6944', 'H6946', 'H6950', 'H6951', 'H6955', 'H6960', 'H6963', 'H6965', 'H6967', 'H6996', 'H6999', 'H7004', 'H7019', 'H7023', 'H7027', 'H7032', 'H7036', 'H7043', 'H7045', 'H7050', 'H7065', 'H7068', 'H7069', 'H7070', 'H7093', 'H7097', 'H7105', 'H7107', 'H7114', 'H7121', 'H7122', 'H7125', 'H7126', 'H7130', 'H7133', 'H7138', 'H7141', 'H7151', 'H7161', 'H7167', 'H7175', 'H7181', 'H7185', 'H7186', 'H7194', 'H7198', 'H7200', 'H7205', 'H7218', 'H7223', 'H7225', 'H7227', 'H7230', 'H7235', 'H7243', 'H7253', 'H7257', 'H7259', 'H7261', 'H7264', 'H7272', 'H7281', 'H7291', 'H7307', 'H7311', 'H7321', 'H7323', 'H7326', 'H7337', 'H7339', 'H7341', 'H7342', 'H7346', 'H7350', 'H7354', 'H7355', 'H7356', 'H7358', 'H7364', 'H7368', 'H7378', 'H7379', 'H7381', 'H7392', 'H7393', 'H7401', 'H7414', 'H7416', 'H7433', 'H7440', 'H7442', 'H7451', 'H7453', 'H7457', 'H7458', 'H7462', 'H7488', 'H7489', 'H7493', 'H7495', 'H7497', 'H7503', 'H7521', 'H7522', 'H7523', 'H7533', 'H7535', 'H7561', 'H7562', 'H7563', 'H7568', 'H7579', 'H7585', 'H7586', 'H7592', 'H7604', 'H7605', 'H7611', 'H7614', 'H7617', 'H7626', 'H7628', 'H7637', 'H7646', 'H7650', 'H7651', 'H7657', 'H7665', 'H7667', 'H7673', 'H7676', 'H7684', 'H7699', 'H7701', 'H7703', 'H7704', 'H7706', 'H7716', 'H7723', 'H7725', 'H7760', 'H7768', 'H7778', 'H7782', 'H7794', 'H7806', 'H7810', 'H7812', 'H7819', 'H7832', 'H7837', 'H7843', 'H7845', 'H7848', 'H7854', 'H7857', 'H7860', 'H7887', 'H7891', 'H7892', 'H7896', 'H7901', 'H7911', 'H7919', 'H7925', 'H7927', 'H7931', 'H7939', 'H7941', 'H7965', 'H7967', 'H7969', 'H7970', 'H7971', 'H7979', 'H7992', 'H7993', 'H7998', 'H7999', 'H8002', 'H8003', 'H8010', 'H8025', 'H8027', 'H8033', 'H8034', 'H8040', 'H8045', 'H8047', 'H8050', 'H8055', 'H8057', 'H8064', 'H8065', 'H8066', 'H8071', 'H8074', 'H8077', 'H8081', 'H8083', 'H8084', 'H8085', 'H8088', 'H8095', 'H8096', 'H8098', 'H8104', 'H8111', 'H8121', 'H8123', 'H8127', 'H8130', 'H8141', 'H8142', 'H8145', 'H8147', 'H8163', 'H8165', 'H8172', 'H8179', 'H8181', 'H8184', 'H8193', 'H8198', 'H8199', 'H8210', 'H8213', 'H8227', 'H8242', 'H8248', 'H8251', 'H8252', 'H8254', 'H8255', 'H8267', 'H8269', 'H8283', 'H8300', 'H8313', 'H8328', 'H8334', 'H8336', 'H8337', 'H8342', 'H8345', 'H8346', 'H8354', 'H8378', 'H8384', 'H8392', 'H8393', 'H8394', 'H8398', 'H8401', 'H8403', 'H8414', 'H8415', 'H8416', 'H8426', 'H8432', 'H8433', 'H8435', 'H8438', 'H8441', 'H8444', 'H8446', 'H8451', 'H8457', 'H8467', 'H8478', 'H8482', 'H8486', 'H8492', 'H8504', 'H8518', 'H8535', 'H8543', 'H8548', 'H8549', 'H8551', 'H8552', 'H8558', 'H8559', 'H8573', 'H8577', 'H8582', 'H8597', 'H8605', 'H8610', 'H8615', 'H8628', 'H8641', 'H8643', 'H8659', 'H8668', 'H8671', 'H8672',
  };

  /// Returns true if the Strong's ID has an authentic recording in the repository
  bool isStrongsCataloged(String? strongsId) {
    if (strongsId == null || strongsId.isEmpty) return false;
    return catalogedStrongsIds.contains(strongsId.trim().toUpperCase());
  }

  bool isPlaying(String key) => currentlyPlayingKey.value == key;

  Future<void> stop() async {
    try {
      await _player.stop();
    } catch (_) {}
    currentlyPlayingKey.value = null;
    isLoading.value = false;
  }

  /// Cleans pointed/unpointed original Hebrew or Greek words
  String cleanOriginalWord(String word) {
    return word
        .replaceAll(RegExp(r'[\.,;:!?׃־—–\[\]\(\)\{\}\x22\x27״׳·]'), '')
        .trim();
  }

  /// Checks if language is Aramaic (currently suspended pending scholarly review)
  bool isAramaic(String lang) => lang.toLowerCase().trim() == 'aramaic';

  /// Resolves standard Google TTS language code (iw for Hebrew, el for Greek)
  String resolveLangCode(String lang) {
    final l = lang.toLowerCase().trim();
    if (l == 'hebrew' || l == 'he' || l == 'iw') {
      return 'iw';
    }
    return 'el';
  }

  /// Base URL for verified human-recorded Strong's audio files (Erasmian Greek, Masoretic Hebrew, Biblical Aramaic)
  static const String trustedAudioBaseUrl =
      'https://raw.githubusercontent.com/manalattia80-web/arabic-bible-study/main/audio_repository/strongs';

  /// Plays trusted audio for a given Strong's ID, prioritizing authentic human recordings.
  /// 1. Checks local cache for `strongs_${cleanId}.mp3`.
  /// 2. If not found locally, attempts to fetch from the authentic Strong's audio repository.
  /// 3. If not yet in the authentic repository:
  ///    - For Aramaic: halts cleanly without playing modern Hebrew TTS.
  ///    - For Greek/Hebrew: falls back to approximate automated pronunciation if word is provided.
  Future<bool> playStrongs({
    required String strongsId,
    required String language,
    String? word,
    String? fallbackUrl,
  }) async {
    final cleanId = strongsId.trim().toUpperCase();
    if (cleanId.isEmpty || cleanId == '---' || cleanId == '-' || cleanId.startsWith('NEG-') || cleanId.startsWith('PREP-') || cleanId.startsWith('CONJ-') || cleanId.startsWith('PRON-')) {
      if (word != null && word.isNotEmpty) {
        return await playWord(word: word, lang: language);
      }
      return false;
    }

    final bool aramaic = isAramaic(language);
    final cacheKey = 'strongs_$cleanId';

    // Toggle pause/stop if already playing this Strong's audio
    if (currentlyPlayingKey.value == cacheKey) {
      await stop();
      return true;
    }

    await stop();
    isLoading.value = true;
    currentlyPlayingKey.value = cacheKey;

    try {
      final cacheDir = await _getCacheDir();
      final localFile = File(p.join(cacheDir.path, '$cacheKey.mp3'));

      // 1. Play from local cache if file exists and has valid audio data
      if (await localFile.exists() && (await localFile.length()) > 200) {
        isLoading.value = false;
        await _player.setFilePath(localFile.path);
        await _player.play();
        return true;
      }

      // 2. Fetch authentic Strong's audio from repository
      final trustedUrl = '$trustedAudioBaseUrl/$cleanId.mp3';
      try {
        final res = await http.get(Uri.parse(trustedUrl), headers: const {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'audio/mpeg, audio/*; q=0.9, */*; q=0.1',
        }).timeout(const Duration(seconds: 4));

        if (res.statusCode == 200 && res.bodyBytes.length > 200) {
          await localFile.writeAsBytes(res.bodyBytes, flush: true);
          isLoading.value = false;
          await _player.setFilePath(localFile.path);
          await _player.play();
          return true;
        }
      } catch (e) {
        debugPrint('Trusted audio fetch attempt for $cleanId: $e');
      }

      // 3. Fallback behavior
      if (aramaic) {
        debugPrint('Authentic audio for Aramaic $cleanId not yet in repository. Fallback to Hebrew TTS is suspended.');
        await stop();
        return false;
      }

      // Fallback to approximate pronunciation for Greek or Hebrew
      if (word != null && word.trim().isNotEmpty && word != '-' && word != '---') {
        return await playWord(word: word, lang: language);
      } else if (fallbackUrl != null && fallbackUrl.isNotEmpty) {
        return await playUrl(fallbackUrl);
      }

      await stop();
      return false;
    } catch (e) {
      debugPrint('AudioPlaybackService playStrongs error: $e');
      await stop();
      return false;
    }
  }

  /// Plays audio for a given word and language.
  /// Checks local disk cache first. If not cached, downloads audio bytes,
  /// saves to file, and plays via setFilePath.
  Future<bool> playWord({
    required String word,
    required String lang,
  }) async {
    final cleanWord = cleanOriginalWord(word);
    if (cleanWord.isEmpty || cleanWord == '-' || cleanWord == '—' || cleanWord.contains('---')) {
      return false;
    }

    if (isAramaic(lang)) {
      debugPrint('Aramaic audio playback is suspended pending scholarly review: $cleanWord');
      return false;
    }

    final langCode = resolveLangCode(lang);
    final cacheKey = '${langCode}_$cleanWord';

    // If already playing this word, toggle pause/stop
    if (currentlyPlayingKey.value == cacheKey) {
      await stop();
      return true;
    }

    await stop();
    isLoading.value = true;
    currentlyPlayingKey.value = cacheKey;

    try {
      final cacheDir = await _getCacheDir();
      final safeFileName = '${base64Url.encode(utf8.encode(cacheKey)).replaceAll('=', '')}.mp3';
      final localFile = File(p.join(cacheDir.path, safeFileName));

      // 1. Play from local cache if file exists and has valid audio data
      if (await localFile.exists() && (await localFile.length()) > 200) {
        isLoading.value = false;
        await _player.setFilePath(localFile.path);
        await _player.play();
        return true;
      }

      // 2. Not cached: fetch audio bytes via HTTP client
      final endpoints = [
        'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(cleanWord)}&tl=$langCode&client=gtx',
        'https://translate.google.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(cleanWord)}&tl=$langCode&client=tw-ob',
      ];

      final headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://translate.google.com/',
      };

      Uint8List? audioBytes;
      for (final endpoint in endpoints) {
        try {
          final res = await http.get(Uri.parse(endpoint), headers: headers).timeout(const Duration(seconds: 5));
          if (res.statusCode == 200 && res.bodyBytes.length > 200) {
            audioBytes = res.bodyBytes;
            break;
          }
        } catch (_) {}
      }

      if (audioBytes != null && audioBytes.isNotEmpty) {
        await localFile.writeAsBytes(audioBytes, flush: true);
        isLoading.value = false;
        await _player.setFilePath(localFile.path);
        await _player.play();
        return true;
      } else {
        // Failed to download audio
        debugPrint('Failed to download TTS audio for: $cleanWord ($langCode)');
        await stop();
        return false;
      }
    } catch (e) {
      debugPrint('AudioPlaybackService error: $e');
      await stop();
      return false;
    }
  }

  /// Plays audio from an existing URL or parses query parameters
  Future<bool> playUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      final word = uri.queryParameters['q'];
      final lang = uri.queryParameters['tl'] ?? 'iw';

      if (word != null && word.isNotEmpty) {
        return await playWord(word: word, lang: lang);
      }

      // Direct fallback if not a Google TTS URL
      await stop();
      currentlyPlayingKey.value = url;
      isLoading.value = false;
      await _player.setUrl(
        url,
        headers: const {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      );
      await _player.play();
      return true;
    } catch (e) {
      debugPrint('Direct audio URL playback failed: $e');
      await stop();
      return false;
    }
  }

  Future<Directory> _getCacheDir() async {
    final temp = await getTemporaryDirectory();
    final d = Directory(p.join(temp.path, 'audio_cache'));
    if (!await d.exists()) {
      await d.create(recursive: true);
    }
    return d;
  }

  void dispose() {
    _player.dispose();
    currentlyPlayingKey.dispose();
    isLoading.dispose();
  }
}
