# Papyonlab's Artifacts Platform

## Introduction

This platform is a web application that allows users to upload build artifacts and share them with other team members. You can share ad-hoc builds and apk files. Appload also support direct install ipa files for iOS applications through the iTunes.

## Installation

Install the dependencies

```
yarn install
```

Add the environment variables to the `.env` file

```
HOST=localhost:3000 
```

the `HOST` variable is used to share the link to the artifacts.


Start the server

```
yarn build && yarn start
```

### Via Docker
// TODO



## Usage

After starting the server, you can access the platform through the browser at `http://localhost:3000`. You can upload the artifacts by any tool that supports the `multipart/form-data` format. You can use the `curl` command to upload the artifacts.

```bash
curl --location --request PUT 'http://localhost:3000/api/upload' \
--form 'artifact=@"/path/to/your/artifact.ipa"' \
--form 'appName="your-app-name"' --progress-bar  | cat

############################################ 100.0%
> http://localhost:3000/build/your-app-name/
```

![alt text](image.png)
