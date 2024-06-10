# tenplustwo

_CLI to fetch and save HS and Madhyamik results in a bulk_

## Setting up locally

- Clone the tenplustwo repository

```bash
    git clone git@github.com:sanam2405/tenplustwo.git
    cd rp
```

- Install the dependencies

```bash
    npm install
```

- Build the source

```bash
    npm run build
```

- Fetch the results

```bash
   npm start -- -y <year> -r <roll> -l <lower_limit> -u <upper_limit>
   npm start -- --year <year> --roll <roll> --lower <lower_limit> --upper <upper_limit>
```

Example

```bash
   npm start -- -y 2024 -r 432521 -l 1247 -u 1350
   npm start -- --year 2024 --roll 432521 --lower 1247 --upper 1350
```
