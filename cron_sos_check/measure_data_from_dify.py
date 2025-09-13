import requests
from batch_process import get_height
import asyncio
import csv
import base64

url_get_from_dify = "http://35.213.67.93/get-sos"
url_upload_to_dify = "http://35.213.67.93/upload-sos"
# elastic search / csv / basic authentation
# username = "55oshie-ru"
# password = "log4me"

x_api_key = "7dbe5f653a2b"
headers = {
    "x-api-key": x_api_key,
}


def write_to_csv(fix_slides, csv_file_name):
    # Write to CSV
    with open(csv_file_name, mode="w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(
            csvfile, fieldnames=fix_slides[0].keys(), quoting=csv.QUOTE_ALL
        )
        writer.writeheader()  # write column headers
        writer.writerows(fix_slides)

    print(f"CSV saved to: {csv_file_name}")


def upload_to_dify():
    file_path = "sos_2025071.csv"
    with open(file_path, "rb") as f:
        file_data = f.read()

    base64_encoded = base64.b64encode(file_data).decode("utf-8")

    headers = {"x-api-key": x_api_key, "Content-Type": "application/json"}
    payload = {"filename": f"processed_{file_path}", "contentBase64": base64_encoded}

    response = requests.post(url_upload_to_dify, json=payload, headers=headers)

    if response.ok:
        print("Upload success:", response.json())
    else:
        print("Upload failed:", response.status_code, response.text)
    pass


async def main():
    try:
        # response = requests.post(url, auth=(username, password))
        # response = requests.post(url_get_from_dify, headers=headers)
        # response.raise_for_status()  # Raise an error for bad responses (4xx/5xx)
        # data = response.json()  # Parse JSON response
        # print(f"response ----- {response.headers}")
        # print("Keys:", list(data.keys()))
        # json_file_name = data["filename"]  # sos_20250718.json
        # print(f"file name ----- {json_file_name}")
        # content = data["content"]
        # csv_file_name = f"{json_file_name}.csv"
        # fix_slides = await get_height(data=content)
        # write_to_csv(fix_slides, csv_file_name)
        
        # upload to dify
        upload_to_dify()
        print("Done!!")
    except requests.exceptions.RequestException as e:
        print("Request failed:", e)
    except ValueError:
        print("Response was not valid JSON.")
    pass


if __name__ == "__main__":
    asyncio.run(main())
