USE db_auth;
UPDATE users
SET password = '$2a$10$uPXNpUOU2bjTTnbVz0KA1eSrj9X8oS4gh.ubvs37jA0Nr4PtA5pH.',
    is_active = 1,
    is_verified = 1
WHERE email = 'admin@ecopria.local';
