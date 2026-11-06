// Arabic / French dictionary. Each key: [arabic, french]
const D = {
  // navigation & general
  home: ['الرئيسية', 'Accueil'], skins: ['السكنات المجانية', 'Skins gratuits'], methods: ['طرق الحصول', 'Comment obtenir'],
  news: ['الأخبار', 'Actualités'], leaks: ['التسريبات', 'Fuites'], events: ['الأحداث', 'Événements'],
  developers: ['المطورون', 'Développeurs'], seasons: ['السيزونات', 'Saisons'], admin: ['الإدارة', 'Administration'],
  server: ['السيرفر', 'Serveur'], language: ['اللغة', 'Langue'], theme: ['الثيم', 'Thème'],
  theme_gold: ['ذهبي', 'Or'], theme_crimson: ['قرمزي', 'Rouge'], theme_light: ['فاتح', 'Clair'],
  tagline: ['مرجعك لأخبار وسكنات وتسريبات فري فاير', 'Votre référence pour les actus, skins et fuites Free Fire'],
  viewAll: ['عرض الكل', 'Voir tout'], back: ['رجوع', 'Retour'], close: ['إغلاق', 'Fermer'], open: ['فتح', 'Ouvrir'],
  all: ['الكل', 'Tous'], global: ['كل السيرفرات', 'Tous les serveurs'], menu: ['القائمة', 'Menu'],
  // home sections
  sec_season: ['نهاية السيزون', 'Fin de la saison'], latest_news: ['آخر الأخبار', 'Dernières actualités'],
  latest_leaks: ['أحدث التسريبات', 'Dernières fuites'], new_skins: ['السكنات المجانية الجديدة', 'Nouveaux skins gratuits'],
  upcoming_events: ['الأحداث القادمة', 'Événements à venir'], dev_section: ['المطورون', 'Les développeurs'],
  quick_links: ['الأقسام المهمة', 'Sections importantes'],
  q_skins: ['كل السكنات المجانية الموثقة', 'Tous les skins gratuits vérifiés'], q_methods: ['كيف تحصل عليها رسمياً', 'Comment les obtenir officiellement'],
  q_news: ['تحديثات وإعلانات', 'Mises à jour et annonces'], q_leaks: ['ما هو قادم', 'Ce qui arrive'],
  q_events: ['تقويم الفعاليات', 'Calendrier des événements'], q_dev: ['فريق اللعبة والسيرفر', 'Équipe du jeu et du serveur'],
  // season
  season_none: ['لم يتم تحديد سيزون بعد', 'Aucune saison définie pour le moment'],
  season_ended: ['انتهى السيزون — بانتظار السيزون الجديد', 'La saison est terminée — en attente de la nouvelle saison'],
  season_word: ['السيزون', 'Saison'], ends_on: ['ينتهي في', 'Se termine le'], active: ['الحالي', 'En cours'],
  days: ['أيام', 'Jours'], hours: ['ساعات', 'Heures'], minutes: ['دقائق', 'Minutes'], seconds: ['ثوانٍ', 'Secondes'],
  season_archive: ['أرشيف السيزونات', 'Archives des saisons'], past_seasons: ['السيزونات السابقة', 'Saisons précédentes'],
  started: ['بدأ', 'Début'],
  // filters
  search_name: ['ابحث بالاسم…', 'Rechercher par nom…'], f_type_lbl: ['النوع', 'Type'], f_av_lbl: ['حالة التوفر', 'Disponibilité'],
  sort: ['الترتيب', 'Tri'], sort_new: ['الأحدث', 'Plus récent'], sort_old: ['الأقدم', 'Plus ancien'], sort_name: ['الاسم', 'Nom'],
  // skins
  type_clothes: ['ملابس', 'Vêtements'], type_weapons: ['أسلحة', 'Armes'], type_characters: ['شخصيات', 'Personnages'],
  type_backpacks: ['حقائب', 'Sacs'], type_parachutes: ['مظلات', 'Parachutes'], type_accessories: ['إكسسوارات', 'Accessoires'],
  type_vehicles: ['مركبات', 'Véhicules'], type_other: ['أخرى', 'Autres'],
  av_available: ['متاح', 'Disponible'], av_soon: ['قريباً', 'Bientôt'], av_ended: ['انتهى', 'Terminé'], av_unconfirmed: ['غير مؤكد', 'Non confirmé'],
  how_free: ['طريقة الحصول مجاناً', 'Comment l’obtenir gratuitement'], source: ['المصدر', 'Source'], source_none: ['غير محدد', 'Non précisée'],
  last_update: ['آخر تحديث', 'Dernière mise à jour'], offer_start: ['بداية العرض', 'Début de l’offre'], offer_end: ['نهاية العرض', 'Fin de l’offre'],
  description: ['الوصف', 'Description'], method: ['الطريقة', 'Méthode'], no_date: ['—', '—'],
  // methods
  method_official_events: ['الأحداث الرسمية', 'Événements officiels'], method_missions: ['المهام', 'Missions'],
  method_rewards: ['المكافآت', 'Récompenses'], method_login: ['تسجيل الدخول', 'Connexion quotidienne'],
  method_game_events: ['فعاليات اللعبة', 'Événements du jeu'], method_seasonal: ['المكافآت الموسمية', 'Récompenses de saison'],
  method_other: ['طرق رسمية أخرى', 'Autres méthodes officielles'],
  md_official_events: ['فعاليات رسمية تعلن عنها غارينا داخل اللعبة أو عبر قنواتها الرسمية، وقد تمنح عناصر مجانية لفترة محدودة.', 'Événements officiels annoncés par Garena dans le jeu ou sur ses canaux officiels, pouvant offrir des objets gratuits pour une durée limitée.'],
  md_missions: ['إكمال المهام داخل اللعبة (يومية أو أسبوعية أو خاصة بحدث) للحصول على مكافآت.', 'Accomplir les missions du jeu (quotidiennes, hebdomadaires ou liées à un événement) pour obtenir des récompenses.'],
  md_rewards: ['مكافآت رسمية داخل اللعبة مثل الجوائز المجانية التي قد تظهر في قسم المكافآت أو المتجر.', 'Récompenses officielles dans le jeu, comme des lots gratuits pouvant apparaître dans la section récompenses ou la boutique.'],
  md_login: ['مكافآت الدخول إلى اللعبة خلال فترة محددة، يومية أو خاصة بحدث معيّن.', 'Récompenses de connexion au jeu pendant une période donnée, quotidiennes ou liées à un événement.'],
  md_game_events: ['فعاليات اللعبة الخاصة والموسمية (احتفالات، تعاونات…) وما تتضمنه من مهام وجوائز.', 'Événements spéciaux et saisonniers du jeu (célébrations, collaborations…) avec leurs missions et récompenses.'],
  md_seasonal: ['مكافآت الموسم، مثل ما قد يتوفر في المسار المجاني من الرويال باس ومكافآت نهاية السيزون.', 'Récompenses de saison, comme ce que peut offrir la piste gratuite du Royale Pass et les récompenses de fin de saison.'],
  md_other: ['أي طريقة رسمية أخرى تعلنها اللعبة نفسها.', 'Toute autre méthode officielle annoncée par le jeu lui-même.'],
  methods_intro: ['كل ما هو مذكور هنا يعتمد على مصادر رسمية فقط. السكنات المرتبطة بكل طريقة تظهر عند توفر معلومات موثقة.', 'Tout ce qui figure ici repose uniquement sur des sources officielles. Les skins liés à chaque méthode apparaissent lorsque des informations vérifiées existent.'],
  warn_unofficial: ['لا ننشر طرقاً غير رسمية. أي موقع أو تطبيق يعدك بسكنات مجانية مقابل بيانات حسابك أو “مولد جواهر” هو احتيال وقد يؤدي لخسارة حسابك.', 'Nous ne publions aucune méthode non officielle. Tout site ou application promettant des skins gratuits contre vos identifiants, ou un « générateur de diamants », est une arnaque pouvant entraîner la perte de votre compte.'],
  linked_skins: ['السكنات المرتبطة', 'Skins liés'], no_linked: ['لا توجد سكنات موثقة لهذه الطريقة حالياً.', 'Aucun skin vérifié pour cette méthode pour le moment.'],
  // news
  cat_updates: ['التحديثات', 'Mises à jour'], cat_events: ['الأحداث', 'Événements'], cat_announcements: ['الإعلانات', 'Annonces'],
  cat_maintenance: ['الصيانة', 'Maintenance'], cat_servers: ['أخبار السيرفرات', 'Actus serveurs'], cat_general: ['أخبار عامة', 'Actualités générales'],
  pinned: ['مثبّت', 'Épinglé'], published_on: ['تاريخ النشر', 'Publié le'],
  // leaks
  lcat_skins: ['تسريبات السكنات', 'Fuites de skins'], lcat_events: ['تسريبات الأحداث', 'Fuites d’événements'], lcat_royalepass: ['الرويال باس', 'Royale Pass'],
  lcat_updates: ['التحديثات القادمة', 'Mises à jour à venir'], lcat_future: ['محتويات مستقبلية', 'Contenus futurs'],
  conf_unconfirmed: ['غير مؤكد', 'Non confirmé'], conf_expected: ['متوقع', 'Probable'], conf_official: ['مؤكد من مصدر رسمي', 'Confirmé par source officielle'],
  expected_date: ['التاريخ المتوقع', 'Date prévue'], confidence: ['درجة التأكد', 'Fiabilité'],
  leak_warn: ['التسريبات غير الرسمية قد تتغير أو تكون غير صحيحة.', 'Les fuites non officielles peuvent changer ou être inexactes.'],
  // events
  calendar: ['التقويم', 'Calendrier'], upcoming: ['القادمة', 'À venir'], past_events: ['الأحداث المنتهية', 'Événements terminés'],
  starts_in: ['يبدأ بعد', 'Commence dans'], ends_in: ['ينتهي بعد', 'Se termine dans'], ongoing: ['جارٍ الآن', 'En cours'], event_ended: ['انتهى', 'Terminé'],
  event_start: ['البداية', 'Début'], event_end: ['النهاية', 'Fin'], no_events_day: ['لا أحداث في هذا اليوم', 'Aucun événement ce jour'],
  soon_label: ['قريباً', 'Bientôt'],
  // developers
  kind_developer: ['مطوّر', 'Développeur'], kind_publisher: ['ناشر', 'Éditeur'], kind_creator: ['صانع محتوى', 'Créateur de contenu'],
  kind_community: ['ممثل المجتمع', 'Représentant de la communauté'],
  role_lbl: ['الوظيفة', 'Poste'], bio_lbl: ['نبذة تعريفية', 'À propos'], role_in_lbl: ['الدور في اللعبة / السيرفر', 'Rôle dans le jeu / serveur'],
  contrib_lbl: ['المساهمات', 'Contributions'], dev_note: ['نميّز بين المطور والناشر وصانع المحتوى وممثل المجتمع.', 'Nous distinguons développeur, éditeur, créateur de contenu et représentant de la communauté.'],
  // interactions
  comments: ['التعليقات', 'Commentaires'], add_comment: ['أضف تعليقاً', 'Ajouter un commentaire'], your_name: ['اسمك', 'Votre nom'],
  comment_ph: ['اكتب تعليقك…', 'Écrivez votre commentaire…'], send: ['إرسال', 'Envoyer'], no_comments: ['لا توجد تعليقات بعد. كن أول من يعلّق!', 'Pas encore de commentaires. Soyez le premier !'],
  cooldown: ['انتظر قليلاً قبل إرسال تعليق آخر.', 'Patientez un peu avant un autre commentaire.'], too_short: ['التعليق قصير جداً.', 'Commentaire trop court.'],
  bad_content: ['التعليق يحتوي على محتوى غير مسموح.', 'Le commentaire contient un contenu non autorisé.'],
  links_blocked: ['الروابط غير مسموحة في التعليقات.', 'Les liens ne sont pas autorisés dans les commentaires.'],
  dup_comment: ['هذا التعليق مكرر.', 'Commentaire en double.'], comment_sent: ['تم نشر تعليقك', 'Commentaire publié'],
  auth_needed: ['تعذر تفعيل التفاعل. تأكد من تفعيل الدخول المجهول في Firebase.', 'Interaction impossible. Vérifiez que la connexion anonyme est activée dans Firebase.'],
  like: ['إعجاب', 'J’aime'],
  // notifications
  notifications: ['الإشعارات', 'Notifications'], no_notifs: ['لا إشعارات جديدة', 'Aucune notification'],
  enable_push: ['تفعيل إشعارات المتصفح', 'Activer les notifications du navigateur'],
  push_unsupported: ['متصفحك لا يدعم الإشعارات.', 'Votre navigateur ne prend pas en charge les notifications.'],
  push_not_configured: ['إشعارات المتصفح لم تُفعَّل من الإدارة بعد.', 'Les notifications du navigateur ne sont pas encore activées par l’administrateur.'],
  push_enabled: ['تم تفعيل إشعارات المتصفح', 'Notifications du navigateur activées'], push_denied: ['تم رفض الإذن', 'Permission refusée'],
  push_fail: ['تعذر تفعيل الإشعارات', 'Impossible d’activer les notifications'],
  n_news: ['خبر جديد', 'Nouvelle actualité'], n_leak: ['تسريب جديد', 'Nouvelle fuite'], n_skin: ['سكن مجاني جديد', 'Nouveau skin gratuit'], n_event: ['حدث جديد', 'Nouvel événement'],
  // states
  loading: ['جارٍ التحميل…', 'Chargement…'], error_load: ['تعذر تحميل البيانات.', 'Impossible de charger les données.'],
  perm_hint: ['تأكد من نشر قواعد Firestore وتفعيل الخدمات المطلوبة.', 'Vérifiez que les règles Firestore sont publiées et que les services sont activés.'],
  retry: ['إعادة المحاولة', 'Réessayer'], empty_skins: ['لا توجد سكنات منشورة لهذا السيرفر بعد.', 'Aucun skin publié pour ce serveur pour le moment.'],
  empty_news: ['لا توجد أخبار منشورة بعد.', 'Aucune actualité publiée pour le moment.'], empty_leaks: ['لا توجد تسريبات منشورة بعد.', 'Aucune fuite publiée pour le moment.'],
  empty_events: ['لا توجد أحداث منشورة بعد.', 'Aucun événement publié pour le moment.'], empty_devs: ['لم تتم إضافة مطورين بعد.', 'Aucun développeur ajouté pour le moment.'],
  no_results: ['لا نتائج مطابقة.', 'Aucun résultat.'], not_found: ['العنصر غير موجود.', 'Élément introuvable.'],
  disclaimer: ['موقع معجبين مستقل وغير تابع لشركة Garena. Free Fire علامة تجارية تعود لأصحابها.', 'Site de fans indépendant, non affilié à Garena. Free Fire est une marque appartenant à ses propriétaires.'],
  // admin
  a_login: ['دخول الإدارة', 'Connexion admin'], a_username: ['اسم المستخدم', 'Nom d’utilisateur'], a_password: ['كلمة المرور', 'Mot de passe'],
  a_signin: ['دخول', 'Connexion'], a_signout: ['خروج', 'Déconnexion'], a_bad_login: ['اسم المستخدم أو كلمة المرور غير صحيحة.', 'Identifiants incorrects.'],
  a_not_admin: ['هذا الحساب غير مصرّح له بالإدارة.', 'Ce compte n’est pas autorisé.'],
  a_uid_hint: ['لتفعيله: في Firebase افتح Firestore وأنشئ مستنداً في المجموعة admins معرّفه هو الرقم التالي (UID):', 'Pour l’activer : dans Firestore, créez un document dans la collection admins dont l’ID est cet UID :'],
  a_dashboard: ['لوحة المعلومات', 'Tableau de bord'], a_visits: ['إجمالي الزيارات', 'Visites totales'], a_visits_today: ['زيارات اليوم', 'Visites aujourd’hui'],
  a_likes: ['الإعجابات', 'J’aime'], a_comments_n: ['التعليقات', 'Commentaires'], a_pending: ['سكنات بانتظار المراجعة', 'Skins en attente'],
  a_last7: ['آخر 7 أيام', '7 derniers jours'], a_new: ['إضافة جديد', 'Ajouter'], a_edit: ['تعديل', 'Modifier'], a_delete: ['حذف', 'Supprimer'],
  a_save: ['حفظ', 'Enregistrer'], a_cancel: ['إلغاء', 'Annuler'], a_confirm_delete: ['هل تريد الحذف نهائياً؟', 'Supprimer définitivement ?'],
  a_saved: ['تم الحفظ', 'Enregistré'], a_deleted: ['تم الحذف', 'Supprimé'], a_approve: ['موافقة ونشر', 'Approuver et publier'], a_reject: ['رفض', 'Rejeter'],
  a_preview: ['معاينة', 'Aperçu'], a_hide: ['إخفاء', 'Masquer'], a_show: ['إظهار', 'Afficher'], a_empty: ['لا توجد عناصر.', 'Aucun élément.'],
  a_required: ['حقل مطلوب ناقص:', 'Champ obligatoire manquant :'], a_err: ['حدث خطأ:', 'Erreur :'], a_approved: ['تم النشر', 'Publié'], a_rejected: ['تم الرفض', 'Rejeté'],
  a_settings: ['إعدادات الموقع', 'Paramètres du site'], a_servers: ['السيرفرات', 'Serveurs'], a_images: ['الصور', 'Images'],
  a_comments_tab: ['التعليقات', 'Commentaires'], a_new_season: ['إنشاء سيزون جديد', 'Créer une saison'],
  a_upload: ['رفع صورة من الهاتف', 'Téléverser une image'], a_search_img: ['بحث عن صور', 'Chercher des images'], a_uploading: ['جارٍ الرفع…', 'Téléversement…'],
  a_img_search_hint: ['نتائج من Wikimedia Commons (رخص مفتوحة). للحصول على صور رسمية، انسخ رابط الصورة من الموقع الرسمي والصقه.', 'Résultats de Wikimedia Commons (licences libres). Pour des images officielles, copiez le lien depuis le site officiel.'],
  a_use: ['استخدام', 'Utiliser'], a_no_img: ['لا نتائج.', 'Aucun résultat.'], a_img_ref: ['معرّف الصورة', 'Référence'],
  a_err_skin_src: ['السكن يحتاج رابط مصدر موثوق (لا نقبل سكناً بلا دليل).', 'Le skin nécessite une source fiable (aucun skin sans preuve).'],
  a_err_official: ['لا يمكن اختيار «مؤكد» إلا إذا كان نوع المصدر رسمياً ومعه رابط.', '« Confirmé » exige une source officielle avec un lien.'],
  a_err_name: ['أدخل الاسم/العنوان بلغة واحدة على الأقل.', 'Saisissez le nom/titre dans au moins une langue.'],
  a_err_dates: ['تاريخ النهاية يجب أن يكون بعد البداية.', 'La date de fin doit suivre la date de début.'],
  a_note_pending: ['أي سكن جديد يُحفظ بحالة «بانتظار المراجعة» ولا يراه الزوار إلا بعد موافقتك.', 'Tout nouveau skin est « en attente » et invisible tant que vous ne l’approuvez pas.'],
  status_pending: ['بانتظار المراجعة', 'En attente'], status_published: ['منشور', 'Publié'], status_rejected: ['مرفوض', 'Rejeté'], status_draft: ['مسودة', 'Brouillon'],
  yes: ['نعم', 'Oui'], no: ['لا', 'Non'], st_unofficial: ['غير رسمي', 'Non officiel'], st_official: ['رسمي', 'Officiel'],
  // field labels
  f_name_ar: ['الاسم (عربي)', 'Nom (arabe)'], f_name_fr: ['الاسم (فرنسي)', 'Nom (français)'], f_name: ['الاسم', 'Nom'],
  f_title_ar: ['العنوان (عربي)', 'Titre (arabe)'], f_title_fr: ['العنوان (فرنسي)', 'Titre (français)'],
  f_desc_ar: ['الوصف (عربي)', 'Description (arabe)'], f_desc_fr: ['الوصف (فرنسي)', 'Description (français)'],
  f_howto_ar: ['طريقة الحصول مجاناً (عربي)', 'Obtention gratuite (arabe)'], f_howto_fr: ['طريقة الحصول مجاناً (فرنسي)', 'Obtention gratuite (français)'],
  f_body_ar: ['المحتوى (عربي)', 'Contenu (arabe)'], f_body_fr: ['المحتوى (فرنسي)', 'Contenu (français)'],
  f_details_ar: ['التفاصيل (عربي)', 'Détails (arabe)'], f_details_fr: ['التفاصيل (فرنسي)', 'Détails (français)'],
  f_type: ['النوع', 'Type'], f_server: ['السيرفر', 'Serveur'], f_method: ['طريقة الحصول', 'Méthode'], f_imageUrl: ['الصورة (رابط أو معرّف)', 'Image (lien ou référence)'],
  f_startsAt: ['تاريخ البداية', 'Date de début'], f_endsAt: ['تاريخ النهاية', 'Date de fin'], f_availability: ['حالة التوفر', 'Disponibilité'],
  f_sourceName: ['اسم المصدر', 'Nom de la source'], f_sourceUrl: ['رابط المصدر', 'Lien de la source'], f_status: ['الحالة', 'Statut'],
  f_category: ['التصنيف', 'Catégorie'], f_pinned: ['تثبيت في الأعلى', 'Épingler en haut'], f_publishedAt: ['تاريخ النشر', 'Date de publication'],
  f_expectedAt: ['التاريخ المتوقع للظهور', 'Date d’apparition prévue'], f_confidence: ['درجة التأكد', 'Fiabilité'], f_sourceType: ['نوع المصدر', 'Type de source'],
  f_role_ar: ['الوظيفة (عربي)', 'Poste (arabe)'], f_role_fr: ['الوظيفة (فرنسي)', 'Poste (français)'], f_kind: ['الفئة', 'Catégorie'],
  f_bio_ar: ['نبذة (عربي)', 'Bio (arabe)'], f_bio_fr: ['نبذة (فرنسي)', 'Bio (français)'],
  f_roleIn_ar: ['الدور في اللعبة/السيرفر (عربي)', 'Rôle (arabe)'], f_roleIn_fr: ['الدور في اللعبة/السيرفر (فرنسي)', 'Rôle (français)'],
  f_contrib_ar: ['المساهمات (عربي)', 'Contributions (arabe)'], f_contrib_fr: ['المساهمات (فرنسي)', 'Contributions (français)'],
  f_number: ['رقم السيزون', 'Numéro de saison'], f_isActive: ['السيزون الحالي', 'Saison actuelle'], f_code: ['رمز السيرفر (مثل MENA)', 'Code serveur (ex. MENA)'],
  f_enabled: ['مفعّل', 'Activé'], f_defaultTheme: ['الثيم الافتراضي', 'Thème par défaut'], f_defaultLang: ['اللغة الافتراضية', 'Langue par défaut'],
  f_defaultServer: ['السيرفر الافتراضي', 'Serveur par défaut'], f_vapidKey: ['مفتاح VAPID لإشعارات المتصفح', 'Clé VAPID (notifications)'],
  f_badWords: ['كلمات محظورة في التعليقات (مفصولة بفاصلة)', 'Mots interdits (séparés par des virgules)'], f_useStorage: ['استخدام Firebase Storage للصور', 'Utiliser Firebase Storage'],
  f_siteNote: ['ملاحظة أعلى الموقع (اختياري)', 'Bandeau d’information (optionnel)']
};

let lang = 'ar';
try { lang = localStorage.getItem('ffl_lang') || 'ar'; } catch { /* storage blocked */ }
if (!['ar', 'fr'].includes(lang)) lang = 'ar';

export const getLang = () => lang;
export const hasLangPref = () => { try { return !!localStorage.getItem('ffl_lang'); } catch { return false; } };
export function applyDir() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
export function setLang(l, persist = true) {
  lang = l === 'fr' ? 'fr' : 'ar';
  if (persist) { try { localStorage.setItem('ffl_lang', lang); } catch { /* ignore */ } }
  applyDir();
}
export const t = (k) => { const v = D[k]; return v ? v[lang === 'ar' ? 0 : 1] : k; };
// Pick a bilingual field: title_ar / title_fr, falling back to the other language or the plain field
export function pick(o, k) {
  if (!o) return '';
  const other = lang === 'ar' ? 'fr' : 'ar';
  return o[`${k}_${lang}`] || o[`${k}_${other}`] || o[k] || '';
}
