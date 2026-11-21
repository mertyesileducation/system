# Kan Tahlili — Kurulum ve QR Formatı

## Yükleme
Klasörün tamamını sunucuya (ör. `https://mertyesil.com.tr/`) yükleyin. **HTTPS şart**: kamera ve uygulama olarak yükleme yalnızca https üzerinde çalışır.

## Videoları eklemek
`js/tests.js` dosyasında her değerin `dusuk`, `normal`, `yuksek` videoları var. `"*"` yerine adres yazın:
- Kendi dosyanız: `"videolar/hemoglobin-dusuk.mp4"`
- YouTube: `"https://youtu.be/XXXXXXXX"` (otomatik gömülür)

`"*"` kalan videolar "Video yakında" olarak görünür.

## Güncelleme yayınlarken
`sw.js` içindeki `VERSION` değerini artırın (`kt-v1` → `kt-v2`), böylece yüklü uygulamalar yeni dosyaları alır. Yalnızca `tests.js`'i (video linkleri) değiştirdiyseniz gerek yok, o dosya her açılışta güncel çekilir.

## Tahlil kağıdına basılacak QR içeriği
Önerilen biçim (telefonun kendi kamerasıyla okutulduğunda da uygulamayı açar):

```
https://mertyesil.com.tr/?t=HGB:10.8;WBC:7.2;PLT:460
```

- Değerler `;` ile ayrılır, `KOD:değer` biçimindedir. Ondalık için `.` ya da `,` kullanılabilir.
- Laboratuvarın kendi referans aralığını eklemek için: `HGB:10.8:12-16`. Aralık verilirse `tests.js`'teki varsayılan aralık yerine bu kullanılır.
- Adres olmadan yalnızca `HGB:10.8;WBC:7.2` metni de okunur.

Tanımlı kodlar: HGB, RBC, HCT, WBC, PLT, GLU, FER, B12, VITD, TSH. Yeni değer eklemek için `tests.js`'e aynı yapıda yeni bir satır ekleyin.

`ornek-qr.png` deneme amaçlı örnek bir QR koddur.
