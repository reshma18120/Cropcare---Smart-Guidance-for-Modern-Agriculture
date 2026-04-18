import requests
import pandas as pd
import time

# =====================================================
# CONFIGURATION
# =====================================================

API_KEY = "579b464db66ec23bdd0000017d7d1c4fcfc945eb758d89d2bfabbcdf"

RESOURCE_ID = "35985678-0d79-46b4-9ed6-6f13308a1d24"

BASE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

LIMIT = 1000
TOTAL_RECORDS = 50000

# Optional commodity filtering
COMMODITIES = [
    "Onion",
    "Tomato",
    "Potato",
    "Rice",
    "Wheat"
]

# =====================================================
# FUNCTION: FETCH DATA
# =====================================================

def fetch_data():

    all_data = []

    print("Starting Agmarknet data collection...\n")

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    for offset in range(0, TOTAL_RECORDS, LIMIT):

        params = {
            "api-key": API_KEY,
            "format": "json",
            "limit": LIMIT,
            "offset": offset
        }

        try:
            response = requests.get(
                BASE_URL,
                params=params,
                headers=headers,
                timeout=60
            )

            if response.status_code != 200:
                print("API request failed:", response.status_code)
                print(response.text)
                break

            data = response.json()
            records = data.get("records", [])

            if not records:
                print("No more records found.")
                break

            df = pd.DataFrame(records)

            # Normalize column names
            df.columns = df.columns.str.lower()

            # Commodity filtering
            if "commodity" in df.columns:
                df = df[df["commodity"].isin(COMMODITIES)]

            if not df.empty:
                all_data.append(df)

            print(f"Collected {offset + len(records)} records")

            time.sleep(1)

        except Exception as e:
            print("Error:", e)
            break

    if not all_data:
        print("\nNo data collected from API.")
        return pd.DataFrame()

    return pd.concat(all_data, ignore_index=True)


# =====================================================
# FUNCTION: CLEAN DATA
# =====================================================

def clean_data(df):

    print("\nCleaning dataset...")

    if df.empty:
        return df

    # Convert prices to numeric
    for col in ["min_price", "max_price", "modal_price"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Convert arrival date
    if "arrival_date" in df.columns:
        df["arrival_date"] = pd.to_datetime(df["arrival_date"], errors="coerce")

    df = df.dropna()

    return df


# =====================================================
# MAIN PROGRAM
# =====================================================

if __name__ == "__main__":

    df = fetch_data()

    if df.empty:
        print("No dataset generated.")
        exit()

    df = clean_data(df)

    print("\nDataset Preview:\n")
    print(df.head())

    # =================================================
    # SAVE DATASET (CSV ONLY)
    # =================================================

    csv_file = "agmarknet_market_prices_large.csv"

    df.to_csv(csv_file, index=False)

    print("\nDataset saved successfully!")
    print("CSV file:", csv_file)

    print("\nTotal records collected:", len(df))