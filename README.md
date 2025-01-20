# Admin Bot
Admin bot used for LA CTF challenges.

## Configuration
The admin bot is designed to be an extensible Docker image that can be deployed to Google Cloud Run. Environment variables can optionally be stored in a file as `KEY=VALUE` pairs in either `/app/chall.env` or `/app/.env`, and challenge handlers will be read from the `/app/handlers` directory.

To use reCAPTCHA, set the `RECAPTCHA_SITE` and `RECAPTCHA_SECRET` environment variables to the correct value.

An example of deployment can be seen in the [`example`](example) directory. The Docker container must be run with `--privileged` for Chrome's sandbox, or deployed in a second generation Cloud Run instance.
