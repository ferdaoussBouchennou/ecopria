-- db_notification — données pour captures (navbar notifications)
USE db_notification;

INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
(1, 'Bienvenue sur Ecopria', 'Votre compte citoyen est actif. Explorez les actions pres de chez vous.', 'SUCCESS', 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 'Inscription confirmee', 'Vous etes inscrite a l action Nettoyage plage Martil. Presentez votre QR le jour J.', 'SUCCESS', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 'Points gagnes', 'Bravo ! +70 points pour votre participation a une action ecologique.', 'SUCCESS', 0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 'Nouvelle offre partenaire', 'Cafe Botanique propose -20% sur le menu du jour (150 pts).', 'INFO', 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'Coupon genere', 'Votre coupon ECO-SANAE-001 est pret. Valable 30 jours.', 'SUCCESS', 0, NOW()),
(20, 'Compte association valide', 'Votre association est visible sur la plateforme.', 'SUCCESS', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(101, 'Compte partenaire valide', 'Publiez vos premieres offres dans votre espace partenaire.', 'SUCCESS', 1, DATE_SUB(NOW(), INTERVAL 4 DAY));
