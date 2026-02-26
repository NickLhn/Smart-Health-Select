ALTER TABLE sys_merchant
ADD COLUMN legal_person_id_last4 varchar(4) NULL,
ADD COLUMN legal_person_id_hash varchar(64) NULL,
ADD COLUMN legal_person_address varchar(255) NULL,
ADD COLUMN id_card_authority varchar(100) NULL,
ADD COLUMN id_card_valid_from date NULL,
ADD COLUMN id_card_valid_to date NULL,
ADD COLUMN id_card_valid_long_term tinyint(4) NOT NULL DEFAULT 0;

