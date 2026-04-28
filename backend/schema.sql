-- PostgreSQL Schema for ERP Fee Module
-- Created: March 29, 2026

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(10),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Active', -- Active, Inactive, Graduated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CLASSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(50) UNIQUE NOT NULL,
    section CHAR(1), -- A, B, C, etc.
    academic_year VARCHAR(9), -- 2024-2025
    capacity INT DEFAULT 50,
    current_strength INT DEFAULT 0,
    class_teacher VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Active', -- Active, Inactive, Archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STUDENT-CLASS ENROLLMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_class (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Active', -- Active, Dropped, Graduated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE(student_id, class_id)
);

-- ============================================
-- FEE STRUCTURE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fee_structure (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL,
    fee_type VARCHAR(100) NOT NULL, -- Tuition, Transport, Hostel, Lab, etc.
    amount DECIMAL(10, 2) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'Monthly', -- Monthly, Quarterly, Yearly, One-time
    due_date INT, -- Day of month (1-31)
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ============================================
-- TRANSACTIONS TABLE (Main Fee Payments)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- Cash, Check, UPI, Bank Transfer, Card
    status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Paid, Pending, Partial, Overdue
    payment_date TIMESTAMP,
    due_date DATE,
    notes TEXT,
    receipt_number VARCHAR(50),
    bank_name VARCHAR(100),
    check_number VARCHAR(50),
    upi_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (status)
);

-- ============================================
-- REFUND REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS refund_requests (
    id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL,
    student_id INT NOT NULL,
    reason TEXT NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected, Completed
    requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP,
    refunded_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================
-- PAYMENT RECEIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_receipts (
    id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issued_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_classes_class_code ON classes(class_code);
CREATE INDEX idx_student_class_enrollment ON student_class(enrollment_date);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_fee_structure_class_id ON fee_structure(class_id);

-- ============================================
-- SEED DATA: CLASSES
-- ============================================
INSERT INTO classes (class_name, class_code, section, academic_year, capacity, class_teacher)
VALUES 
    ('Class 12-A', 'CLASS-12-A', 'A', '2024-2025', 50, 'Mr. Kumar Singh'),
    ('Class 12-B', 'CLASS-12-B', 'B', '2024-2025', 48, 'Ms. Priya Sharma'),
    ('Class 11-A', 'CLASS-11-A', 'A', '2024-2025', 52, 'Mr. Rajesh Verma'),
    ('Class 10-A', 'CLASS-10-A', 'A', '2024-2025', 55, 'Ms. Anjali Patel'),
    ('Class 10-B', 'CLASS-10-B', 'B', '2024-2025', 50, 'Mr. Vikram Desai')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: STUDENTS (15 sample students)
-- ============================================
INSERT INTO students (student_id, first_name, last_name, email, phone, gender, city, state, guardian_name, guardian_phone)
VALUES
    ('STU-2024-001', 'Aaryan', 'Gupta', 'aaryan.gupta@school.com', '9876543210', 'M', 'Delhi', 'Delhi', 'Mr. Rajesh Gupta', '9876543200'),
    ('STU-2024-002', 'Priya', 'Sharma', 'priya.sharma@school.com', '9876543211', 'F', 'Bangalore', 'Karnataka', 'Ms. Divya Sharma', '9876543201'),
    ('STU-2024-003', 'Arjun', 'Singh', 'arjun.singh@school.com', '9876543212', 'M', 'Mumbai', 'Maharashtra', 'Mr. Vikram Singh', '9876543202'),
    ('STU-2024-004', 'Ananya', 'Verma', 'ananya.verma@school.com', '9876543213', 'F', 'Hyderabad', 'Telangana', 'Ms. Neha Verma', '9876543203'),
    ('STU-2024-005', 'Karan', 'Patel', 'karan.patel@school.com', '9876543214', 'M', 'Ahmedabad', 'Gujarat', 'Mr. Ashok Patel', '9876543204'),
    ('STU-2024-006', 'Diya', 'Reddy', 'diya.reddy@school.com', '9876543215', 'F', 'Chennai', 'Tamil Nadu', 'Ms. Sunitha Reddy', '9876543205'),
    ('STU-2024-007', 'Rohan', 'Mishra', 'rohan.mishra@school.com', '9876543216', 'M', 'Pune', 'Maharashtra', 'Mr. Sanjay Mishra', '9876543206'),
    ('STU-2024-008', 'Isha', 'Kapoor', 'isha.kapoor@school.com', '9876543217', 'F', 'Delhi', 'Delhi', 'Ms. Kavya Kapoor', '9876543207'),
    ('STU-2024-009', 'Nikhil', 'Joshi', 'nikhil.joshi@school.com', '9876543218', 'M', 'Jaipur', 'Rajasthan', 'Mr. Ramesh Joshi', '9876543208'),
    ('STU-2024-010', 'Nisha', 'Iyer', 'nisha.iyer@school.com', '9876543219', 'F', 'Kochi', 'Kerala', 'Ms. Lakshmi Iyer', '9876543209'),
    ('STU-2024-011', 'Aditya', 'Nair', 'aditya.nair@school.com', '9876543220', 'M', 'Bangalore', 'Karnataka', 'Mr. Suresh Nair', '9876543219'),
    ('STU-2024-012', 'Pooja', 'Das', 'pooja.das@school.com', '9876543221', 'F', 'Kolkata', 'West Bengal', 'Ms. Ritu Das', '9876543220'),
    ('STU-2024-013', 'Vikas', 'Kumar', 'vikas.kumar@school.com', '9876543222', 'M', 'Lucknow', 'Uttar Pradesh', 'Mr. Ajay Kumar', '9876543221'),
    ('STU-2024-014', 'Shreya', 'Desai', 'shreya.desai@school.com', '9876543223', 'F', 'Pune', 'Maharashtra', 'Ms. Meera Desai', '9876543222'),
    ('STU-2024-015', 'Siddharth', 'Rao', 'siddharth.rao@school.com', '9876543224', 'M', 'Hyderabad', 'Telangana', 'Mr. Prakash Rao', '9876543223')
ON CONFLICT (student_id) DO NOTHING;

-- ============================================
-- SEED DATA: STUDENT-CLASS ENROLLMENT
-- ============================================
INSERT INTO student_class (student_id, class_id)
SELECT s.id, c.id FROM students s, classes c
WHERE s.student_id IN ('STU-2024-001', 'STU-2024-002', 'STU-2024-003', 'STU-2024-004', 'STU-2024-005')
AND c.class_code = 'CLASS-12-A'
ON CONFLICT DO NOTHING;

INSERT INTO student_class (student_id, class_id)
SELECT s.id, c.id FROM students s, classes c
WHERE s.student_id IN ('STU-2024-006', 'STU-2024-007', 'STU-2024-008', 'STU-2024-009', 'STU-2024-010')
AND c.class_code = 'CLASS-12-B'
ON CONFLICT DO NOTHING;

INSERT INTO student_class (student_id, class_id)
SELECT s.id, c.id FROM students s, classes c
WHERE s.student_id IN ('STU-2024-011', 'STU-2024-012', 'STU-2024-013', 'STU-2024-014', 'STU-2024-015')
AND c.class_code = 'CLASS-11-A'
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: FEE STRUCTURE
-- ============================================
INSERT INTO fee_structure (class_id, fee_type, amount, frequency, due_date)
SELECT c.id, 'Tuition Fee', 5000.00, 'Monthly', 10
FROM classes c WHERE c.class_code IN ('CLASS-12-A', 'CLASS-12-B', 'CLASS-11-A')
UNION ALL
SELECT c.id, 'Transport Fee', 1000.00, 'Monthly', 10
FROM classes c WHERE c.class_code IN ('CLASS-12-A', 'CLASS-12-B', 'CLASS-11-A')
UNION ALL
SELECT c.id, 'Lab Fee', 500.00, 'Quarterly', 10
FROM classes c WHERE c.class_code IN ('CLASS-12-A', 'CLASS-12-B', 'CLASS-11-A')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: TRANSACTIONS (Jan - June 2024)
-- Monthly fee payments for all students
-- ============================================

-- JANUARY 2024 TRANSACTIONS
INSERT INTO transactions (transaction_id, student_id, class_id, invoice_number, amount, payment_method, status, payment_date, due_date)
SELECT 
    'TXN-2024-01-' || ROW_NUMBER() OVER (ORDER BY s.id),
    s.id,
    sc.class_id,
    'INV-2024-01-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.id)::text, 3, '0'),
    6500.00,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 4
        WHEN 0 THEN 'Cash'
        WHEN 1 THEN 'UPI'
        WHEN 2 THEN 'Bank Transfer'
        ELSE 'Check'
    END,
    'Paid',
    '2024-01-' || LPAD((ROW_NUMBER() OVER (ORDER BY s.id) % 20 + 1)::text, 2, '0') || ' 10:00:00',
    '2024-01-10'
FROM students s
JOIN student_class sc ON s.id = sc.student_id
ON CONFLICT DO NOTHING;

-- FEBRUARY 2024 TRANSACTIONS
INSERT INTO transactions (transaction_id, student_id, class_id, invoice_number, amount, payment_method, status, payment_date, due_date)
SELECT 
    'TXN-2024-02-' || ROW_NUMBER() OVER (ORDER BY s.id),
    s.id,
    sc.class_id,
    'INV-2024-02-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.id)::text, 3, '0'),
    6500.00,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 4
        WHEN 0 THEN 'Cash'
        WHEN 1 THEN 'UPI'
        WHEN 2 THEN 'Bank Transfer'
        ELSE 'Check'
    END,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 5
        WHEN 0 THEN 'Pending'
        ELSE 'Paid'
    END,
    CASE WHEN (ROW_NUMBER() OVER (ORDER BY s.id)) % 5 = 0 THEN NULL
        ELSE ('2024-02-' || LPAD((ROW_NUMBER() OVER (ORDER BY s.id) % 20 + 1)::text, 2, '0') || ' 10:00:00')::timestamp
    END,
    '2024-02-10'
FROM students s
JOIN student_class sc ON s.id = sc.student_id
ON CONFLICT DO NOTHING;

-- MARCH 2024 TRANSACTIONS
INSERT INTO transactions (transaction_id, student_id, class_id, invoice_number, amount, payment_method, status, payment_date, due_date)
SELECT 
    'TXN-2024-03-' || ROW_NUMBER() OVER (ORDER BY s.id),
    s.id,
    sc.class_id,
    'INV-2024-03-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.id)::text, 3, '0'),
    6500.00,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 4
        WHEN 0 THEN 'Cash'
        WHEN 1 THEN 'UPI'
        WHEN 2 THEN 'Bank Transfer'
        ELSE 'Check'
    END,
    'Paid',
    '2024-03-' || LPAD((ROW_NUMBER() OVER (ORDER BY s.id) % 20 + 1)::text, 2, '0') || ' 10:00:00',
    '2024-03-10'
FROM students s
JOIN student_class sc ON s.id = sc.student_id
ON CONFLICT DO NOTHING;

-- APRIL 2024 TRANSACTIONS
INSERT INTO transactions (transaction_id, student_id, class_id, invoice_number, amount, payment_method, status, payment_date, due_date)
SELECT 
    'TXN-2024-04-' || ROW_NUMBER() OVER (ORDER BY s.id),
    s.id,
    sc.class_id,
    'INV-2024-04-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.id)::text, 3, '0'),
    6500.00,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 4
        WHEN 0 THEN 'Cash'
        WHEN 1 THEN 'UPI'
        WHEN 2 THEN 'Bank Transfer'
        ELSE 'Check'
    END,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 7
        WHEN 0 THEN 'Overdue'
        WHEN 1 THEN 'Pending'
        ELSE 'Paid'
    END,
    CASE WHEN (ROW_NUMBER() OVER (ORDER BY s.id)) % 7 IN (0, 1) THEN NULL
        ELSE ('2024-04-' || LPAD((ROW_NUMBER() OVER (ORDER BY s.id) % 20 + 1)::text, 2, '0') || ' 10:00:00')::timestamp
    END,
    '2024-04-10'
FROM students s
JOIN student_class sc ON s.id = sc.student_id
ON CONFLICT DO NOTHING;

-- MAY 2024 TRANSACTIONS
INSERT INTO transactions (transaction_id, student_id, class_id, invoice_number, amount, payment_method, status, payment_date, due_date)
SELECT 
    'TXN-2024-05-' || ROW_NUMBER() OVER (ORDER BY s.id),
    s.id,
    sc.class_id,
    'INV-2024-05-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.id)::text, 3, '0'),
    6500.00,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 4
        WHEN 0 THEN 'Cash'
        WHEN 1 THEN 'UPI'
        WHEN 2 THEN 'Bank Transfer'
        ELSE 'Check'
    END,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 6
        WHEN 0 THEN 'Partial'
        ELSE 'Paid'
    END,
    '2024-05-' || LPAD((ROW_NUMBER() OVER (ORDER BY s.id) % 20 + 1)::text, 2, '0') || ' 10:00:00',
    '2024-05-10'
FROM students s
JOIN student_class sc ON s.id = sc.student_id
ON CONFLICT DO NOTHING;

-- JUNE 2024 TRANSACTIONS
INSERT INTO transactions (transaction_id, student_id, class_id, invoice_number, amount, payment_method, status, payment_date, due_date)
SELECT 
    'TXN-2024-06-' || ROW_NUMBER() OVER (ORDER BY s.id),
    s.id,
    sc.class_id,
    'INV-2024-06-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.id)::text, 3, '0'),
    6500.00,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 4
        WHEN 0 THEN 'Cash'
        WHEN 1 THEN 'UPI'
        WHEN 2 THEN 'Bank Transfer'
        ELSE 'Check'
    END,
    CASE (ROW_NUMBER() OVER (ORDER BY s.id)) % 8
        WHEN 0 THEN 'Pending'
        ELSE 'Paid'
    END,
    CASE WHEN (ROW_NUMBER() OVER (ORDER BY s.id)) % 8 = 0 THEN NULL
        ELSE ('2024-06-' || LPAD((ROW_NUMBER() OVER (ORDER BY s.id) % 20 + 1)::text, 2, '0') || ' 10:00:00')::timestamp
    END,
    '2024-06-10'
FROM students s
JOIN student_class sc ON s.id = sc.student_id
ON CONFLICT DO NOTHING;

-- ============================================
-- VIEW: MONTHLY COLLECTION SUMMARY
-- ============================================
CREATE OR REPLACE VIEW vw_monthly_collection AS
SELECT 
    DATE_TRUNC('month', t.payment_date)::DATE as month,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN t.status = 'Paid' THEN t.amount ELSE 0 END) as amount_collected,
    SUM(CASE WHEN t.status = 'Pending' THEN t.amount ELSE 0 END) as amount_pending,
    SUM(CASE WHEN t.status = 'Overdue' THEN t.amount ELSE 0 END) as amount_overdue,
    SUM(CASE WHEN t.status = 'Partial' THEN t.amount ELSE 0 END) as amount_partial,
    SUM(t.amount) as total_amount
FROM transactions t
WHERE t.payment_date IS NOT NULL
GROUP BY DATE_TRUNC('month', t.payment_date)
ORDER BY month DESC;

-- ============================================
-- VIEW: PAYMENT METHOD DISTRIBUTION
-- ============================================
CREATE OR REPLACE VIEW vw_payment_method_distribution AS
SELECT 
    t.payment_method,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM transactions t
WHERE t.status IN ('Paid', 'Partial')
GROUP BY t.payment_method
ORDER BY total_amount DESC;

-- ============================================
-- VIEW: STUDENT FEE STATUS
-- ============================================
CREATE OR REPLACE VIEW vw_student_fee_status AS
SELECT 
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    c.class_name,
    COUNT(t.id) as total_fee_records,
    SUM(CASE WHEN t.status = 'Paid' THEN t.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN t.status = 'Pending' THEN t.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN t.status = 'Overdue' THEN t.amount ELSE 0 END) as total_overdue,
    SUM(t.amount) as total_due
FROM students s
JOIN student_class sc ON s.id = sc.student_id
JOIN classes c ON sc.class_id = c.id
LEFT JOIN transactions t ON s.id = t.student_id
GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.id, c.class_name
ORDER BY s.student_id;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Verify seeded data:
SELECT 'Classes' as table_name, COUNT(*) as record_count FROM classes
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Student-Class Enrollments', COUNT(*) FROM student_class
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Fee Structure', COUNT(*) FROM fee_structure;
