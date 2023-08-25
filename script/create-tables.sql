-- Script SQL pour créer les tables

-- Table user
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lastname VARCHAR(255) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('employee', 'customer') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table batch
CREATE TABLE batch (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table jackpot
CREATE TABLE jackpot (
    id INT PRIMARY KEY AUTO_INCREMENT,
    amount DECIMAL(10, 2) NOT NULL,
    batchId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batchId) REFERENCES batch(id)
);

-- Table shop
CREATE TABLE shop (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table ticket
CREATE TABLE ticket (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    shopId INT NOT NULL,
    batchId INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES user(id),
    FOREIGN KEY (shopId) REFERENCES shop(id),
    FOREIGN KEY (batchId) REFERENCES batch(id)
);
