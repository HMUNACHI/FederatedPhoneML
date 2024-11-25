from supabase import create_client, Client
from datetime import datetime, timedelta, timezone
import time
import json
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
def get_available_devices(table_name):
    try:
        response = (
            supabase
            .table(table_name)
            .select("id, device_pulse") 
            .eq("device_status", "active")
            .execute()
        )

        # Process the response
        if response.data:
            print("Data retrieved successfully!")
            return response.data
        else:
            print("No data found matching the criteria.")
            return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

def filter_recent_pulses(objects):
    now = datetime.now(timezone.utc)

    # Define the cutoff time (1 minute ago)
    cutoff_time = now - timedelta(minutes=1)

    filtered_objects = [
        obj for obj in objects
        if datetime.fromisoformat(obj['device_pulse'].replace('Z', '+00:00')) > cutoff_time
    ]

    # Extract list of 'id' values from the filtered objects
    ids = [obj['id'] for obj in filtered_objects]

    return filtered_objects, ids

def write_and_wait_for_response(table_name, row_id, request_column, response_column, request_value):
    try:
        request_json = json.dumps(request_value)

        # Write to the request column
        update_response = (
            supabase
            .table(table_name)
            .update({request_column: request_json})
            .eq("id", row_id)
            .execute()
        )

        # Start checking for a response
        start_time = datetime.now(timezone.utc)
        timeout = timedelta(seconds=10)

        while datetime.now(timezone.utc) - start_time < timeout:
            # Query the response column
            response = (
                supabase
                .table(table_name)
                .select(response_column)
                .eq("id", row_id)
                .execute()
            )

            if response.data:
                response_value = response.data[0][response_column]
                # If the response column is updated (not None), return the value
                if response_value is not None:
                    return response_value

            # Wait for 1 second before checking again
            time.sleep(1)

        print("Timeout: No response within 10 seconds.")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


data = get_available_devices("training_messages")
data, ids = filter_recent_pulses(data)

if ids:
    response = write_and_wait_for_response(
        table_name="training_messages",
        row_id=ids[0],
        request_column="training_request",
        response_column="training_response",
        request_value={"test": 232}
    )
    print(f"Response received: {response}")
else:
    print("No active devices found.")
