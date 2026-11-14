# ORBIT Backend: vazifalar holati

## Bajarilgan
- [x] Server ishga tushishi (lifespan), simulyator fon vazifasi
- [x] Yagona `/status`, Action Center
- [x] Qattiq yozilgan qiymatlar olib tashlandi, ishonch `RULE_BASED`
- [x] Kumulyativ doza (integral), oynadan mustaqil
- [x] Barqarorlik: ketma-ket 3 namuna qoidasi (hysteresis)
- [x] `STALE` holati (10 s, yoki ma'lumot yo'q)
- [x] Risk engine `/status` ga ulangan, chegaralar `core/thresholds.py` da
- [x] Kiritish validatsiyasi (422)
- [x] CORS sozlamalari, `reload` muhit o'zgaruvchisi orqali
- [x] Testlar (pytest, 30 ta)
- [x] Standart og'ish va tendentsiya (`heart_rate_std`, `heart_rate_trend_bpm_per_min`)
- [x] Ma'lumotlar bazasi: SQLite, qayta ishga tushganda tiklanadi
- [x] Ekipaj va missiya ID (`crew_id`, `mission_id`), ekipajga xos holat
- [x] Idempotentlik (`event_id`)
- [x] Check-in (`POST /crew/{id}/checkin`), eskalatsiya, LOS hodisalari (`GET /events`)
- [x] API hujjati (`API_DOCS.md`) yangilandi

## Qolgan (keyingi bosqich)
- [ ] PostgreSQL ga ko'chirish (hozir SQLite, prototip uchun yetarli)
- [ ] Namunalar jadvalini tozalash yoki arxivlash (cheksiz o'sadi)
- [ ] Ollama integratsiyasi (lokal AI tavsiya)
- [ ] Post-missiya hisoboti
- [ ] NASA DONKI integratsiyasi (kosmik ob-havo)
- [ ] Roadmap / missiya bosqichlari endpointi
- [ ] Bir nechta ekipajni frontendda tanlash
- [ ] Python 3.10 da (Dockerfile) va Docker Compose da sinov
- [ ] Chegaralarni mutaxassis bilan tasdiqlash
- [ ] Frontend bilan ulanish (frontend tomonidan)
