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
    'G11', 'G18', 'G25', 'G26', 'G27', 'G32', 'G37', 'G40', 'G59', 'G68', 'G71', 'G79', 'G80', 'G91', 'G93', 'G125', 'G129', 'G142', 'G154', 'G165', 'G166', 'G169', 'G189', 'G190', 'G191', 'G203', 'G225', 'G227', 'G228', 'G235', 'G240', 'G243', 'G264', 'G266', 'G268', 'G281', 'G290', 'G305', 'G308', 'G314', 'G321', 'G337', 'G386', 'G417', 'G435', 'G444', 'G450', 'G455', 'G473', 'G514', 'G518', 'G537', 'G565', 'G571', 'G575', 'G591', 'G599', 'G601', 'G611', 'G615', 'G622', 'G630', 'G649', 'G652', 'G680', 'G684', 'G686', 'G720', 'G721', 'G737', 'G740', 'G746', 'G749', 'G756', 'G758', 'G769', 'G770', 'G773', 'G782', 'G792', 'G837', 'G846', 'G863', 'G891', 'G906', 'G907', 'G908', 'G921', 'G932', 'G935', 'G941', 'G975', 'G987', 'G988', 'G991', 'G1014', 'G1033', 'G1056', 'G1060', 'G1063', 'G1074', 'G1080', 'G1085', 'G1092', 'G1093', 'G1096', 'G1097', 'G1100', 'G1107', 'G1108', 'G1122', 'G1124', 'G1125', 'G1127', 'G1135', 'G1138', 'G1140', 'G1161', 'G1163', 'G1166', 'G1176', 'G1186', 'G1188', 'G1199', 'G1208', 'G1209', 'G1210', 'G1223', 'G1228', 'G1242', 'G1247', 'G1248', 'G1249', 'G1319', 'G1320', 'G1321', 'G1322', 'G1325', 'G1330', 'G1342', 'G1343', 'G1344', 'G1352', 'G1377', 'G1380', 'G1381', 'G1391', 'G1392', 'G1398', 'G1401', 'G1410', 'G1411', 'G1415', 'G1417', 'G1427', 'G1437', 'G1438', 'G1448', 'G1451', 'G1453', 'G1473', 'G1484', 'G1487', 'G1492', 'G1494', 'G1504', 'G1510', 'G1515', 'G1519', 'G1520', 'G1525', 'G1531', 'G1535', 'G1537', 'G1538', 'G1540', 'G1543', 'G1544', 'G1563', 'G1564', 'G1565', 'G1577', 'G1586', 'G1588', 'G1607', 'G1632', 'G1646', 'G1653', 'G1656', 'G1658', 'G1672', 'G1679', 'G1680', 'G1683', 'G1715', 'G1722', 'G1746', 'G1752', 'G1754', 'G1785', 'G1799', 'G1831', 'G1832', 'G1849', 'G1854', 'G1859', 'G1860', 'G1887', 'G1893', 'G1905', 'G1909', 'G1921', 'G1939', 'G1941', 'G1961', 'G1992', 'G1994', 'G2007', 'G2008', 'G2033', 'G2036', 'G2038', 'G2041', 'G2046', 'G2048', 'G2064', 'G2065', 'G2068', 'G2078', 'G2087', 'G2089', 'G2090', 'G2094', 'G2097', 'G2098', 'G2106', 'G2112', 'G2127', 'G2147', 'G2168', 'G2186', 'G2190', 'G2192', 'G2193', 'G2198', 'G2212', 'G2222', 'G2226', 'G2228', 'G2232', 'G2233', 'G2235', 'G2240', 'G2243', 'G2246', 'G2248', 'G2249', 'G2250', 'G2254', 'G2264', 'G2281', 'G2288', 'G2296', 'G2300', 'G2307', 'G2309', 'G2316', 'G2323', 'G2325', 'G2334', 'G2342', 'G2347', 'G2362', 'G2364', 'G2374', 'G2378', 'G2379', 'G2384', 'G2385', 'G2398', 'G2400', 'G2409', 'G2411', 'G2414', 'G2419', 'G2424', 'G2425', 'G2440', 'G2443', 'G2449', 'G2453', 'G2455', 'G2474', 'G2476', 'G2478', 'G2480', 'G2486', 'G2491', 'G2501', 'G2504', 'G2511', 'G2513', 'G2518', 'G2521', 'G2523', 'G2525', 'G2531', 'G2532', 'G2540', 'G2541', 'G2556', 'G2564', 'G2573', 'G2588', 'G2590', 'G2596', 'G2597', 'G2632', 'G2641', 'G2673', 'G2716', 'G2730', 'G2744', 'G2749', 'G2753', 'G2776', 'G2784', 'G2799', 'G2836', 'G2842', 'G2872', 'G2889', 'G2896', 'G2902', 'G2917', 'G2919', 'G2920', 'G2927', 'G2962', 'G2967', 'G2968', 'G2980', 'G2983', 'G2992', 'G3000', 'G3004', 'G3022', 'G3037', 'G3049', 'G3056', 'G3062', 'G3076', 'G3089', 'G3101', 'G3107', 'G3109', 'G3123', 'G3129', 'G3137', 'G3140', 'G3141', 'G3142', 'G3144', 'G3162', 'G3173', 'G3195', 'G3196', 'G3303', 'G3306', 'G3309', 'G3313', 'G3319', 'G3326', 'G3340', 'G3341', 'G3361', 'G3366', 'G3367', 'G3379', 'G3384', 'G3398', 'G3404', 'G3408', 'G3415', 'G3419', 'G3421', 'G3440', 'G3441', 'G3466', 'G3475', 'G3483', 'G3485', 'G3498', 'G3501', 'G3507', 'G3522', 'G3528', 'G3551', 'G3563', 'G3568', 'G3570', 'G3571', 'G3588', 'G3598', 'G3614', 'G3618', 'G3624', 'G3631', 'G3641', 'G3650', 'G3660', 'G3661', 'G3664', 'G3666', 'G3670', 'G3686', 'G3694', 'G3699', 'G3700', 'G3704', 'G3708', 'G3709', 'G3735', 'G3739', 'G3745', 'G3748', 'G3752', 'G3753', 'G3754', 'G3756', 'G3757', 'G3759', 'G3761', 'G3762', 'G3765', 'G3767', 'G3768', 'G3772', 'G3775', 'G3777', 'G3778', 'G3779', 'G3780', 'G3784', 'G3788', 'G3793', 'G3813', 'G3816', 'G3825', 'G3844', 'G3850', 'G3853', 'G3854', 'G3860', 'G3870', 'G3874', 'G3880', 'G3900', 'G3928', 'G3936', 'G3952', 'G3954', 'G3956', 'G3957', 'G3958', 'G3962', 'G3972', 'G3982', 'G3983', 'G3985', 'G3986', 'G3992', 'G4002', 'G4008', 'G4012', 'G4016', 'G4043', 'G4052', 'G4053', 'G4061', 'G4074', 'G4091', 'G4095', 'G4098', 'G4100', 'G4102', 'G4103', 'G4105', 'G4128', 'G4133', 'G4137', 'G4143', 'G4145', 'G4149', 'G4151', 'G4152', 'G4159', 'G4160', 'G4169', 'G4172', 'G4178', 'G4183', 'G4190', 'G4198', 'G4202', 'G4214', 'G4218', 'G4221', 'G4226', 'G4228', 'G4238', 'G4245', 'G4253', 'G4254', 'G4263', 'G4314', 'G4328', 'G4334', 'G4335', 'G4336', 'G4337', 'G4341', 'G4352', 'G4374', 'G4383', 'G4395', 'G4396', 'G4412', 'G4413', 'G4434', 'G4442', 'G4453', 'G4459', 'G4487', 'G4521', 'G4561', 'G4567', 'G4572', 'G4592', 'G4594', 'G4613', 'G4624', 'G4632', 'G4653', 'G4655', 'G4678', 'G4680', 'G4687', 'G4690', 'G4716', 'G4717', 'G4735', 'G4750', 'G4757', 'G4771', 'G4808', 'G4862', 'G4863', 'G4864', 'G4892', 'G4893', 'G4905', 'G4920', 'G4972', 'G4982', 'G4983', 'G4990', 'G4991', 'G5007', 'G5037', 'G5043', 'G5046', 'G5048', 'G5055', 'G5056', 'G5057', 'G5062', 'G5064', 'G5083', 'G5087', 'G5091', 'G5092', 'G5095', 'G5100', 'G5101', 'G5108', 'G5117', 'G5119', 'G5140', 'G5151', 'G5154', 'G5185', 'G5204', 'G5207', 'G5217', 'G5228', 'G5259', 'G5278', 'G5281', 'G5290', 'G5293', 'G5315', 'G5316', 'G5319', 'G5330', 'G5342', 'G5343', 'G5346', 'G5368', 'G5376', 'G5399', 'G5401', 'G5426', 'G5438', 'G5442', 'G5443', 'G5455', 'G5456', 'G5457', 'G5463', 'G5479', 'G5483', 'G5485', 'G5495', 'G5503', 'G5505', 'G5506', 'G5507', 'G5532', 'G5547', 'G5550', 'G5561', 'G5565', 'G5590', 'G5599', 'G5602', 'G5610', 'G5613', 'G5618', 'G5620', 'H1', 'H6', 'H34', 'H40', 'H53', 'H68', 'H74', 'H85', 'H87', 'H113', 'H120', 'H123', 'H127', 'H134', 'H136', 'H157', 'H168', 'H175', 'H176', 'H194', 'H205', 'H214', 'H216', 'H226', 'H227', 'H241', 'H251', 'H256', 'H259', 'H269', 'H270', 'H271', 'H272', 'H310', 'H312', 'H314', 'H319', 'H335', 'H341', 'H346', 'H347', 'H349', 'H352', 'H369', 'H376', 'H389', 'H398', 'H400', 'H408', 'H410', 'H413', 'H423', 'H426', 'H428', 'H430', 'H433', 'H441', 'H452', 'H477', 'H490', 'H499', 'H505', 'H517', 'H518', 'H519', 'H520', 'H539', 'H559', 'H561', 'H562', 'H567', 'H571', 'H582', 'H587', 'H589', 'H595', 'H609', 'H622', 'H631', 'H635', 'H637', 'H639', 'H646', 'H658', 'H669', 'H681', 'H702', 'H705', 'H727', 'H730', 'H734', 'H738', 'H753', 'H758', 'H776', 'H779', 'H784', 'H801', 'H802', 'H804', 'H817', 'H834', 'H835', 'H836', 'H842', 'H853', 'H854', 'H857', 'H859', 'H875', 'H894', 'H898', 'H899', 'H905', 'H929', 'H935', 'H953', 'H954', 'H957', 'H959', 'H977', 'H982', 'H990', 'H995', 'H996', 'H1004', 'H1008', 'H1058', 'H1060', 'H1077', 'H1097', 'H1101', 'H1104', 'H1109', 'H1115', 'H1116', 'H1121', 'H1129', 'H1137', 'H1141', 'H1144', 'H1167', 'H1168', 'H1197', 'H1219', 'H1234', 'H1241', 'H1242', 'H1245', 'H1247', 'H1254', 'H1270', 'H1272', 'H1280', 'H1285', 'H1288', 'H1293', 'H1316', 'H1320', 'H1322', 'H1323', 'H1330', 'H1347', 'H1350', 'H1366', 'H1368', 'H1369', 'H1389', 'H1390', 'H1391', 'H1397', 'H1410', 'H1419', 'H1431', 'H1471', 'H1473', 'H1481', 'H1486', 'H1516', 'H1537', 'H1540', 'H1544', 'H1567', 'H1568', 'H1571', 'H1581', 'H1588', 'H1612', 'H1616', 'H1644', 'H1692', 'H1696', 'H1697', 'H1698', 'H1706', 'H1722', 'H1730', 'H1732', 'H1755', 'H1800', 'H1817', 'H1818', 'H1834', 'H1835', 'H1847', 'H1869', 'H1870', 'H1875', 'H1892', 'H1931', 'H1933', 'H1934', 'H1945', 'H1961', 'H1964', 'H1980', 'H1984', 'H1992', 'H1995', 'H2001', 'H2005', 'H2008', 'H2009', 'H2015', 'H2022', 'H2026', 'H2040', 'H2063', 'H2074', 'H2076', 'H2077', 'H2088', 'H2091', 'H2100', 'H2114', 'H2142', 'H2145', 'H2148', 'H2181', 'H2199', 'H2205', 'H2219', 'H2220', 'H2232', 'H2233', 'H2256', 'H2275', 'H2282', 'H2308', 'H2315', 'H2319', 'H2320', 'H2346', 'H2351', 'H2388', 'H2389', 'H2396', 'H2398', 'H2403', 'H2416', 'H2421', 'H2428', 'H2450', 'H2451', 'H2459', 'H2461', 'H2470', 'H2472', 'H2490', 'H2491', 'H2493', 'H2505', 'H2506', 'H2530', 'H2534', 'H2543', 'H2549', 'H2550', 'H2555', 'H2568', 'H2572', 'H2580', 'H2583', 'H2595', 'H2600', 'H2603', 'H2617', 'H2654', 'H2671', 'H2677', 'H2691', 'H2706', 'H2708', 'H2719', 'H2734', 'H2763', 'H2781', 'H2790', 'H2803', 'H2822', 'H2850', 'H2865', 'H2889', 'H2891', 'H2896', 'H2930', 'H2931', 'H2962', 'H2975', 'H2977', 'H2983', 'H3001', 'H3026', 'H3027', 'H3034', 'H3045', 'H3050', 'H3058', 'H3060', 'H3063', 'H3064', 'H3068', 'H3077', 'H3083', 'H3091', 'H3092', 'H3097', 'H3117', 'H3119', 'H3130', 'H3162', 'H3169', 'H3190', 'H3196', 'H3198', 'H3201', 'H3205', 'H3206', 'H3212', 'H3220', 'H3225', 'H3254', 'H3256', 'H3282', 'H3289', 'H3290', 'H3293', 'H3303', 'H3318', 'H3320', 'H3327', 'H3332', 'H3335', 'H3372', 'H3374', 'H3379', 'H3381', 'H3383', 'H3384', 'H3389', 'H3390', 'H3405', 'H3407', 'H3414', 'H3423', 'H3426', 'H3427', 'H3444', 'H3448', 'H3458', 'H3467', 'H3470', 'H3477', 'H3478', 'H3485', 'H3490', 'H3498', 'H3499', 'H3513', 'H3515', 'H3519', 'H3526', 'H3532', 'H3541', 'H3548', 'H3559', 'H3581', 'H3588', 'H3603', 'H3605', 'H3615', 'H3627', 'H3644', 'H3651', 'H3658', 'H3667', 'H3669', 'H3671', 'H3678', 'H3680', 'H3684', 'H3701', 'H3702', 'H3707', 'H3709', 'H3722', 'H3742', 'H3754', 'H3772', 'H3778', 'H3782', 'H3789', 'H3802', 'H3808', 'H3809', 'H3820', 'H3824', 'H3837', 'H3844', 'H3845', 'H3847', 'H3863', 'H3878', 'H3881', 'H3885', 'H3898', 'H3899', 'H3915', 'H3920', 'H3925', 'H3947', 'H3956', 'H3957', 'H3966', 'H3967', 'H3988', 'H4013', 'H4026', 'H4043', 'H4054', 'H4057', 'H4060', 'H4069', 'H4080', 'H4082', 'H4100', 'H4116', 'H4124', 'H4131', 'H4148', 'H4150', 'H4186', 'H4191', 'H4194', 'H4196', 'H4217', 'H4256', 'H4264', 'H4279', 'H4284', 'H4294', 'H4306', 'H4310', 'H4325', 'H4347', 'H4376', 'H4390', 'H4397', 'H4399', 'H4421', 'H4422', 'H4427', 'H4428', 'H4436', 'H4437', 'H4438', 'H4467', 'H4480', 'H4503', 'H4519', 'H4557', 'H4592', 'H4605', 'H4611', 'H4616', 'H4639', 'H4672', 'H4682', 'H4687', 'H4708', 'H4714', 'H4720', 'H4725', 'H4735', 'H4751', 'H4758', 'H4782', 'H4791', 'H4818', 'H4820', 'H4847', 'H4853', 'H4872', 'H4886', 'H4899', 'H4904', 'H4908', 'H4910', 'H4912', 'H4931', 'H4940', 'H4941', 'H4948', 'H4960', 'H5002', 'H5012', 'H5019', 'H5027', 'H5030', 'H5035', 'H5038', 'H5045', 'H5046', 'H5048', 'H5057', 'H5060', 'H5061', 'H5066', 'H5080', 'H5088', 'H5104', 'H5117', 'H5127', 'H5146', 'H5157', 'H5158', 'H5159', 'H5162', 'H5174', 'H5178', 'H5186', 'H5193', 'H5207', 'H5221', 'H5237', 'H5262', 'H5265', 'H5271', 'H5288', 'H5291', 'H5307', 'H5315', 'H5321', 'H5324', 'H5331', 'H5337', 'H5341', 'H5352', 'H5355', 'H5375', 'H5381', 'H5387', 'H5414', 'H5416', 'H5422', 'H5437', 'H5439', 'H5462', 'H5467', 'H5483', 'H5493', 'H5518', 'H5542', 'H5545', 'H5553', 'H5560', 'H5608', 'H5612', 'H5631', 'H5641', 'H5647', 'H5648', 'H5650', 'H5656', 'H5674', 'H5676', 'H5695', 'H5703', 'H5704', 'H5707', 'H5712', 'H5739', 'H5749', 'H5750', 'H5766', 'H5769', 'H5771', 'H5775', 'H5782', 'H5785', 'H5795', 'H5797', 'H5800', 'H5826', 'H5828', 'H5838', 'H5850', 'H5869', 'H5879', 'H5892', 'H5921', 'H5923', 'H5927', 'H5930', 'H5945', 'H5971', 'H5973', 'H5975', 'H5982', 'H5983', 'H5999', 'H6002', 'H6010', 'H6030', 'H6031', 'H6041', 'H6051', 'H6083', 'H6086', 'H6098', 'H6106', 'H6153', 'H6160', 'H6172', 'H6186', 'H6189', 'H6213', 'H6215', 'H6235', 'H6240', 'H6242', 'H6256', 'H6258', 'H6285', 'H6299', 'H6310', 'H6311', 'H6327', 'H6343', 'H6381', 'H6419', 'H6430', 'H6435', 'H6437', 'H6440', 'H6453', 'H6459', 'H6466', 'H6471', 'H6485', 'H6499', 'H6529', 'H6547', 'H6555', 'H6565', 'H6566', 'H6571', 'H6588', 'H6605', 'H6607', 'H6629', 'H6635', 'H6659', 'H6662', 'H6664', 'H6666', 'H6667', 'H6677', 'H6680', 'H6697', 'H6726', 'H6738', 'H6743', 'H6763', 'H6817', 'H6823', 'H6828', 'H6833', 'H6862', 'H6869', 'H6887', 'H6908', 'H6912', 'H6913', 'H6918', 'H6922', 'H6924', 'H6942', 'H6944', 'H6946', 'H6950', 'H6951', 'H6955', 'H6960', 'H6963', 'H6965', 'H6967', 'H6996', 'H6999', 'H7004', 'H7023', 'H7043', 'H7068', 'H7069', 'H7070', 'H7093', 'H7097', 'H7105', 'H7114', 'H7121', 'H7122', 'H7125', 'H7126', 'H7130', 'H7133', 'H7138', 'H7151', 'H7161', 'H7167', 'H7175', 'H7181', 'H7198', 'H7200', 'H7205', 'H7218', 'H7223', 'H7225', 'H7227', 'H7230', 'H7235', 'H7261', 'H7272', 'H7291', 'H7307', 'H7311', 'H7323', 'H7341', 'H7346', 'H7350', 'H7354', 'H7364', 'H7368', 'H7378', 'H7379', 'H7381', 'H7392', 'H7393', 'H7442', 'H7451', 'H7453', 'H7458', 'H7462', 'H7489', 'H7495', 'H7503', 'H7521', 'H7522', 'H7523', 'H7535', 'H7563', 'H7585', 'H7586', 'H7592', 'H7604', 'H7611', 'H7617', 'H7626', 'H7628', 'H7637', 'H7646', 'H7650', 'H7651', 'H7657', 'H7665', 'H7667', 'H7673', 'H7676', 'H7704', 'H7706', 'H7716', 'H7723', 'H7725', 'H7760', 'H7782', 'H7794', 'H7812', 'H7819', 'H7832', 'H7843', 'H7891', 'H7892', 'H7896', 'H7901', 'H7911', 'H7919', 'H7925', 'H7927', 'H7931', 'H7965', 'H7969', 'H7970', 'H7971', 'H7979', 'H7992', 'H7993', 'H7998', 'H7999', 'H8002', 'H8010', 'H8033', 'H8034', 'H8040', 'H8045', 'H8047', 'H8050', 'H8055', 'H8057', 'H8064', 'H8065', 'H8066', 'H8074', 'H8077', 'H8081', 'H8083', 'H8085', 'H8088', 'H8095', 'H8098', 'H8104', 'H8111', 'H8121', 'H8127', 'H8130', 'H8141', 'H8145', 'H8147', 'H8163', 'H8165', 'H8179', 'H8193', 'H8198', 'H8199', 'H8210', 'H8242', 'H8248', 'H8255', 'H8267', 'H8269', 'H8313', 'H8334', 'H8336', 'H8337', 'H8346', 'H8354', 'H8384', 'H8393', 'H8416', 'H8432', 'H8435', 'H8441', 'H8451', 'H8478', 'H8492', 'H8504', 'H8548', 'H8549', 'H8552', 'H8597', 'H8605', 'H8610', 'H8615', 'H8628', 'H8641', 'H8643', 'H8672',
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
