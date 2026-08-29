-- Enable UUID extension (though gen_random_uuid() is native in newer Postgres, this is good practice)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Universal Trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 1. HOSPITAL TABLE
-- ==========================================
CREATE TABLE hospital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast login lookups
CREATE INDEX idx_hospital_email ON hospital(email);

-- ==========================================
-- 2. AMBULANCE TABLE
-- ==========================================
CREATE TABLE ambulance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospital(id) ON DELETE CASCADE,
    ambulance_id TEXT NOT NULL,
    phone_no TEXT,
    pin TEXT,
    status TEXT DEFAULT 'idle',
    assigned_trip_id UUID,
    current_latitude NUMERIC,
    current_longitude NUMERIC,
    last_location_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_ambulance_status CHECK (status IN ('idle', 'offline', 'onduty', 'maintenance'))
);

-- Indexes for fast filtering by hospital and availability status
CREATE INDEX idx_ambulance_hospital ON ambulance(hospital_id);
CREATE INDEX idx_ambulance_status ON ambulance(status);

-- ==========================================
-- 3. PATIENT TABLE
-- ==========================================
CREATE TABLE patient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospital(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    address TEXT,
    ambulance_id UUID REFERENCES ambulance(id),
    ambulance_ph TEXT,
    patient_condition TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'assign',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_patient_condition CHECK (patient_condition IN ('normal', 'severe', 'dead')),
    CONSTRAINT check_patient_status CHECK (status IN ('assign', 'cancel', 'success'))
);

-- Indexes for fast filtering and dashboard metrics
CREATE INDEX idx_patient_hospital ON patient(hospital_id);
CREATE INDEX idx_patient_status ON patient(status);

-- Attach updated_at trigger to patient table
CREATE TRIGGER update_patient_modtime
BEFORE UPDATE ON patient
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 4. DATABASE RELATIONSHIP FUNCTIONS (RPCs)
-- ==========================================

-- Function to assign an ambulance to a patient
CREATE OR REPLACE FUNCTION assign_ambulance(p_patient_id UUID, p_ambulance_id UUID)
RETURNS VOID AS $$
DECLARE
    v_amb_phone TEXT;
BEGIN
    -- Check if ambulance is actually available
    IF NOT EXISTS (SELECT 1 FROM ambulance WHERE id = p_ambulance_id AND status = 'idle') THEN
        RAISE EXCEPTION 'Ambulance is not available or not idle';
    END IF;

    -- Get ambulance phone number
    SELECT phone_no INTO v_amb_phone FROM ambulance WHERE id = p_ambulance_id;

    -- Update Patient securely
    UPDATE patient 
    SET ambulance_id = p_ambulance_id,
        ambulance_ph = v_amb_phone,
        status = 'assign'
    WHERE id = p_patient_id;

    -- Update Ambulance securely
    UPDATE ambulance
    SET assigned_trip_id = p_patient_id,
        status = 'onduty'
    WHERE id = p_ambulance_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a trip successfully
CREATE OR REPLACE FUNCTION complete_trip(p_patient_id UUID)
RETURNS VOID AS $$
DECLARE
    v_ambulance_id UUID;
BEGIN
    -- Get assigned ambulance ID
    SELECT ambulance_id INTO v_ambulance_id FROM patient WHERE id = p_patient_id;

    -- Update Patient status
    UPDATE patient
    SET status = 'success'
    WHERE id = p_patient_id;

    -- Reset Ambulance status to idle
    IF v_ambulance_id IS NOT NULL THEN
        UPDATE ambulance
        SET status = 'idle',
            assigned_trip_id = NULL
        WHERE id = v_ambulance_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel a trip
CREATE OR REPLACE FUNCTION cancel_trip(p_patient_id UUID)
RETURNS VOID AS $$
DECLARE
    v_ambulance_id UUID;
BEGIN
    -- Get assigned ambulance ID
    SELECT ambulance_id INTO v_ambulance_id FROM patient WHERE id = p_patient_id;

    -- Update Patient status
    UPDATE patient
    SET status = 'cancel'
    WHERE id = p_patient_id;

    -- Reset Ambulance status to idle
    IF v_ambulance_id IS NOT NULL THEN
        UPDATE ambulance
        SET status = 'idle',
            assigned_trip_id = NULL
        WHERE id = v_ambulance_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
