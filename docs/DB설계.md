```sql
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

CREATE TABLE IF NOT EXISTS recipe_likes (
    user_id   INT NOT NULL,
    recipe_id INT NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id)   REFERENCES users(user_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
);
```

```sql
INSERT IGNORE INTO cafes (cafe_id, cafe_name) VALUES
    (1, '스타벅스'),
    (2, '메가커피');

INSERT IGNORE INTO drinks (drink_id, cafe_id, category, drink_name, base_price) VALUES
    (1, 1, '커피', '아이스 카페 아메리카노', 4700),
    (2, 1, '커피', '카페 라떼', 5000),
    (3, 1, '프라푸치노', '자바 칩 프라푸치노', 6300),
    (4, 2, '커피', '아메리카노', 2000),
    (5, 2, '커피', '카페라떼', 2900),
    (6, 2, '스무디', '딸기 스무디', 3900);

INSERT IGNORE INTO options (option_id, cafe_id, category, option_name, extra_price) VALUES
    (1, 1, '샷', '에스프레소 샷 추가', 600),
    (2, 1, '시럽', '바닐라 시럽', 600),
    (3, 1, '시럽', '헤이즐넛 시럽', 600),
    (4, 1, '토핑', '자바칩 추가', 600),
    (5, 1, '토핑', '휘핑 크림 추가', 600),
    (6, 1, '우유', '오트 우유로 변경', 600),
    (7, 2, '샷', '샷 추가', 500),
    (8, 2, '시럽', '바닐라 시럽', 500),
    (9, 2, '토핑', '연유 추가', 500),
    (10, 2, '토핑', '휘핑 추가', 500);
```

### 8.3 API별 쿼리

#### 회원가입 `POST /api/signup` (`auth.js`)

```sql
-- 1. 닉네임 중복 확인 (있으면 409)
SELECT user_id FROM users WHERE username = ?;

-- 2. 가입. 비밀번호는 서버에서 BCrypt 해시로 바꾼 값을 넣는다.
INSERT INTO users (username, password_hash) VALUES (?, ?);
```

#### 로그인 `POST /api/login` (`auth.js`)

```sql
SELECT user_id, username, password_hash FROM users WHERE username = ?;
```

#### 카페 목록 `GET /api/cafes` (`cafes.js`)

```sql
SELECT cafe_id AS cafeId, cafe_name AS cafeName FROM cafes ORDER BY cafe_id;
```

#### 카페의 음료 `GET /api/cafes/:cafeId/drinks` (`cafes.js`)

```sql
SELECT drink_id   AS drinkId,
       cafe_id    AS cafeId,
       category,
       drink_name AS drinkName,
       base_price AS basePrice
  FROM drinks
 WHERE cafe_id = ?
 ORDER BY drink_id;
```

#### 카페의 옵션 `GET /api/cafes/:cafeId/options` (`cafes.js`)

```sql
SELECT option_id   AS optionId,
       cafe_id     AS cafeId,
       category,
       option_name AS optionName,
       extra_price AS extraPrice
  FROM options
 WHERE cafe_id = ?
 ORDER BY option_id;
```

#### 사진 업로드 `POST /api/images` (`images.js`)

```sql
-- data에는 업로드한 파일의 바이트가 그대로 들어간다.
INSERT INTO images (content_type, data) VALUES (?, ?);
```

#### 사진 보기 `GET /api/images/:imageId` (`images.js`)

```sql
SELECT content_type, data FROM images WHERE image_id = ?;
```

#### 레시피 목록 `GET /api/recipes?sort=popular|latest&cafeId=1` (`recipes.js`)

```sql
SELECT r.recipe_id   AS recipeId,
       r.recipe_name AS recipeName,
       r.description,
       r.image_id    AS imageId,
       r.created_at  AS createdAt,
       c.cafe_id     AS cafeId,
       c.cafe_name   AS cafeName,
       d.drink_id    AS drinkId,
       d.drink_name  AS drinkName,
       d.base_price  AS basePrice,
       u.username,
       (SELECT COUNT(*)
          FROM recipe_likes l
         WHERE l.recipe_id = r.recipe_id) AS likes,
       d.base_price +
       (SELECT COALESCE(SUM(o.extra_price * ro.quantity), 0)
          FROM recipe_options ro
          JOIN options o ON o.option_id = ro.option_id
         WHERE ro.recipe_id = r.recipe_id) AS totalPrice
  FROM recipes r
  JOIN drinks d ON d.drink_id = r.drink_id
  JOIN cafes  c ON c.cafe_id  = d.cafe_id
  JOIN users  u ON u.user_id  = r.user_id
```

```sql
-- 카페로 거를 때만 붙는다
WHERE c.cafe_id = ?

-- 인기순 (기본값)
ORDER BY likes DESC, r.created_at DESC, r.recipe_id DESC

-- 최신순 (sort=latest)
ORDER BY r.created_at DESC, r.recipe_id DESC
```

```sql
SELECT ro.recipe_id   AS recipeId,
       o.option_id    AS optionId,
       o.option_name  AS optionName,
       o.extra_price  AS extraPrice,
       ro.quantity
  FROM recipe_options ro
  JOIN options o ON o.option_id = ro.option_id
 WHERE ro.recipe_id IN (?)
 ORDER BY ro.id;
```

#### 레시피 상세 `GET /api/recipes/:recipeId?userId=1` (`recipes.js`)

```sql
-- 1. 기본 SELECT + 레시피 하나
<기본 SELECT> WHERE r.recipe_id = ?;

-- 2. 로그인한 사용자가 좋아요를 눌렀는지 (userId가 있을 때만)
SELECT 1 FROM recipe_likes WHERE recipe_id = ? AND user_id = ?;

-- 3. 옵션 목록 (목록 조회의 옵션 쿼리와 같고, IN에 번호 하나)
```

#### 레시피 작성 `POST /api/recipes` (`recipes.js`)

```sql
SELECT user_id FROM users WHERE user_id = ?;            -- 작성자 (없으면 404)
SELECT cafe_id FROM drinks WHERE drink_id = ?;          -- 기본 음료와 그 카페 (없으면 404)
SELECT image_id FROM images WHERE image_id = ?;         -- 사진 (보냈을 때만, 없으면 404)
SELECT option_id, cafe_id FROM options WHERE option_id IN (?);  -- 옵션들
```

```sql
START TRANSACTION;

INSERT INTO recipes (user_id, drink_id, recipe_name, description, image_id)
VALUES (?, ?, ?, ?, ?);

INSERT INTO recipe_options (recipe_id, option_id, quantity)
VALUES (?, ?, ?), (?, ?, ?), ...;

COMMIT;   -- 중간에 에러가 나면 ROLLBACK
```

#### 좋아요 `POST /api/recipes/:recipeId/likes` (`likes.js`)

```sql
SELECT recipe_id FROM recipes WHERE recipe_id = ?;   -- 레시피 확인 (없으면 404)
SELECT user_id FROM users WHERE user_id = ?;         -- 회원 확인 (없으면 404)
넘어간다
INSERT IGNORE INTO recipe_likes (user_id, recipe_id) VALUES (?, ?);
```

#### 좋아요 취소 `DELETE /api/recipes/:recipeId/likes?userId=1` (`likes.js`)

```sql
DELETE FROM recipe_likes WHERE user_id = ? AND recipe_id = ?;
```
