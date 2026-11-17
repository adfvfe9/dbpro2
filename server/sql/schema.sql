-- 테이블 생성 (npm run db:init 으로 실행, 이미 있는 테이블은 건너뜀)
-- 테이블 이름은 소문자로 둠 (리눅스 MySQL은 테이블 이름 대소문자를 구분함)

CREATE TABLE IF NOT EXISTS cafes (
    cafe_id   INT AUTO_INCREMENT PRIMARY KEY,
    cafe_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS drinks (
    drink_id   INT AUTO_INCREMENT PRIMARY KEY,
    cafe_id    INT NOT NULL,
    category   VARCHAR(20)  NOT NULL,
    drink_name VARCHAR(100) NOT NULL,
    base_price INT NOT NULL,
    FOREIGN KEY (cafe_id) REFERENCES cafes(cafe_id)
);

CREATE TABLE IF NOT EXISTS options (
    option_id   INT AUTO_INCREMENT PRIMARY KEY,
    cafe_id     INT NOT NULL,
    category    VARCHAR(20) NOT NULL,
    option_name VARCHAR(50) NOT NULL,
    extra_price INT NOT NULL DEFAULT 0,
    FOREIGN KEY (cafe_id) REFERENCES cafes(cafe_id)
);

-- 레시피 사진 (파일 자체를 DB에 저장)
CREATE TABLE IF NOT EXISTS images (
    image_id     INT AUTO_INCREMENT PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    data         MEDIUMBLOB  NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
    recipe_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    drink_id    INT NOT NULL,
    recipe_name VARCHAR(100) NOT NULL,
    description TEXT,
    image_id    INT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(user_id),
    FOREIGN KEY (drink_id) REFERENCES drinks(drink_id),
    FOREIGN KEY (image_id) REFERENCES images(image_id)
);

CREATE TABLE IF NOT EXISTS recipe_options (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    option_id INT NOT NULL,
    quantity  INT NOT NULL DEFAULT 1,
    UNIQUE (recipe_id, option_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES options(option_id)
);

-- 한 사람이 한 레시피에 한 번만 누를 수 있으니 (user_id, recipe_id) 자체를 기본키로 씀
CREATE TABLE IF NOT EXISTS recipe_likes (
    user_id   INT NOT NULL,
    recipe_id INT NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id)   REFERENCES users(user_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
);
