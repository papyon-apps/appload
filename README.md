# Papyonlab's Artifacts Platform

![image](https://github.com/papyon-apps/appload/assets/22038798/14bdaaf6-85b5-4b5b-adb7-7b9040e0d32e)

## Introduction


This platform is a web-based application designed to facilitate the uploading and sharing of build artifacts among team members. It supports ad-hoc builds and APK files, along with direct installation of IPA files for iOS applications via iTunes.

## Quick Start

Clone the repository and enter your config

```bash
git clone git@github.com:papyon-apps/appload.git # Clone the repo
cd appload
cp .env.example .env # Bootstrap the .env file
```

Go to the `.env` file and fill your credentials

#### Start the server

```bash
yarn install # Install the dependencies
yarn build # Build the app
yarn start # Serve the app
```

--- 

### Via Docker

```bash
docker run -d -p 3005:3000 -e HOST="http://localhost:3005"  -v ./uploads:/app/uploads papyonlab/appload
```


## Usage

Once the server is up, access the platform via a web browser at http://localhost:3000. Artifacts can be uploaded using any tool that supports the multipart/form-data format. For example, to upload artifacts via the curl command:

```bash
curl --location --request PUT 'http://localhost:3000/api/upload' \
--form 'artifact=@"/path/to/your/artifact.ipa"' \
--form 'appName="your-app-name"' --progress-bar  | cat

############################################ 100.0%
> http://localhost:3000/build/your-app-name/
```

![alt text](image.png)
