-- 1. Hospital Table
CREATE TABLE hospital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ambulance Table
CREATE TABLE ambulance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospital(id) ON DELETE CASCADE,
    ambulance_id TEXT NOT NULL,
    phone_no TEXT,
    pin TEXT,
    status TEXT DEFAULT 'idle',
    assigned_trip_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_ambulance_status CHECK (status IN ('idle', 'offline', 'onduty', 'maintenance'))
);

-- 3. Patient Table
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

-- 4. Database Relationship Functions (RPCs)

-- Function to assign an ambulance to a patient
CREATE OR REPLACE FUNCTION assign_ambulance(p_patient_id UUID, p_ambulance_id UUID)
RETURNS VOID AS $$
DECLARE
    v_amb_phone TEXT;
BEGIN
    -- Check if ambulance is available
    IF NOT EXISTS (SELECT 1 FROM ambulance WHERE id = p_ambulance_id AND status = 'idle') THEN
        RAISE EXCEPTION 'Ambulance is not available or not idle';
    END IF;

    -- Get ambulance phone
    SELECT phone_no INTO v_amb_phone FROM ambulance WHERE id = p_ambulance_id;

    -- Update Patient
    UPDATE patient 
    SET ambulance_id = p_ambulance_id,
        ambulance_ph = v_amb_phone,
        status = 'assign'
    WHERE id = p_patient_id;

    -- Update Ambulance
    UPDATE ambulance
    SET assigned_trip_id = p_patient_id,
        status = 'onduty'
    WHERE id = p_ambulance_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a trip
CREATE OR REPLACE FUNCTION complete_trip(p_patient_id UUID)
RETURNS VOID AS $$
DECLARE
    v_ambulance_id UUID;
BEGIN
    -- Get assigned ambulance
    SELECT ambulance_id INTO v_ambulance_id FROM patient WHERE id = p_patient_id;

    -- Update Patient
    UPDATE patient
    SET status = 'success'
    WHERE id = p_patient_id;

    -- Update Ambulance
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
    -- Get assigned ambulance
    SELECT ambulance_id INTO v_ambulance_id FROM patient WHERE id = p_patient_id;

    -- Update Patient
    UPDATE patient
    SET status = 'cancel'
    WHERE id = p_patient_id;

    -- Update Ambulance
    IF v_ambulance_id IS NOT NULL THEN
        UPDATE ambulance
        SET status = 'idle',
            assigned_trip_id = NULL
        WHERE id = v_ambulance_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
