/*
 * KAN TAHLİLİ DEĞERLERİ — AYAR DOSYASI
 * ------------------------------------
 * Videoları buraya ekleyeceksiniz. Her değerin üç videosu var:
 *   dusuk  → değer referans aralığının ALTINDA ise gösterilir
 *   normal → değer aralığın İÇİNDE (orta) ise gösterilir
 *   yuksek → değer aralığın ÜSTÜNDE ise gösterilir
 *
 * "*" bırakılan video "Video yakında" olarak görünür.
 * Video adresi örnek: "videolar/hemoglobin-dusuk.mp4" veya "https://.../video.mp4"
 *
 * min / max: varsayılan yetişkin referans aralıkları (yaklaşık).
 * Laboratuvarlar farklı aralık kullanabilir; QR kodda aralık gönderilirse
 * QR'daki aralık önceliklidir (bkz. QR-FORMATI.md).
 */
window.KAN_TESTLERI = {
  HGB: {
    ad: "Hemoglobin", birim: "g/dL", min: 12, max: 17.5,
    calisan: "Oksijen taşıyan kuryelerin yükü",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  RBC: {
    ad: "Eritrosit (Alyuvar)", birim: "×10⁶/µL", min: 4.0, max: 5.9,
    calisan: "Oksijen taşıyan kuryeler",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  HCT: {
    ad: "Hematokrit", birim: "%", min: 36, max: 52,
    calisan: "Kurye trafiğinin yoğunluğu",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  WBC: {
    ad: "Lökosit (Akyuvar)", birim: "×10³/µL", min: 4.0, max: 10.0,
    calisan: "Mikroplarla savaşan savunma birlikleri",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  PLT: {
    ad: "Trombosit", birim: "×10³/µL", min: 150, max: 400,
    calisan: "Hasarı kapatan onarım ekipleri",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  GLU: {
    ad: "Açlık Kan Şekeri", birim: "mg/dL", min: 70, max: 100,
    calisan: "Şehrin yakıt deposu",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  FER: {
    ad: "Ferritin", birim: "ng/mL", min: 15, max: 300,
    calisan: "Demir ambarı",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  B12: {
    ad: "B12 Vitamini", birim: "pg/mL", min: 200, max: 900,
    calisan: "Sinir hatlarının bakım ekibi",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  VITD: {
    ad: "D Vitamini", birim: "ng/mL", min: 30, max: 100,
    calisan: "Kemik iskelesinin mühendisleri",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  },
  TSH: {
    ad: "TSH", birim: "mIU/L", min: 0.4, max: 4.0,
    calisan: "Şehrin hız ayarı (tiroid yönetimi)",
    videolar: { dusuk: "*", normal: "*", yuksek: "*" }
  }
};
