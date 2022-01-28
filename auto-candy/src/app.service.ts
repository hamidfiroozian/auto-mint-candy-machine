import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import { stringify } from 'querystring';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class AppService {
  private wallet: string | undefined;

  autoMint(body: any): string {
    const _wallet = body.wallet;
    this.wallet = _wallet;
    console.log(this.wallet);
    const vm = this;
    Logger.warn(
      ' ------------------------------------------------------------- ',
    );

    exec('(cd ../metaplex/js && ls)', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      if (stdout.includes('node_modules')) {
        this.updateWallet(this.wallet);
      } else {
        Logger.error('node_modules not installed in metaplex');

        this.installNpdePackages();
      }
      Logger.error(`stderr: ${stderr}`);
    });
    return 'Minting NFT';
  }
  updateWallet(wallet: string) {
    Logger.warn(
      ' ------------------------------------------------------------- ',
    );
    const vm = this;
    Logger.debug('updating config.json');
    try {
      const data = fs.readFileSync('../config.json', 'utf8');
      const obj = JSON.parse(data);
      obj.solTreasuryAccount = wallet;
      const myJSON = JSON.stringify(obj);
      fs.writeFile('../config.json', myJSON, function (err) {
        if (err) return console.log(err);
        console.log('config.json > Updated');
        Logger.log('update Completed');
        vm.uploadAssets();
      });
    } catch (err) {
      console.error(err);
    }
  }

  uploadAssets() {
    Logger.warn(
      ' ------------------------------------------------------------- ',
    );
    Logger.debug('Start uploading assets');

    exec(
      'npx ts-node ../metaplex/js/packages/cli/src/candy-machine-v2-cli.ts upload \
     -e devnet \
     -k ../keypair.json \
     -cp ../config.json \
     ../assets',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        Logger.log(`stdout: ${stdout}`);
        Logger.error(`stderr: ${stderr}`);
        Logger.debug('Uploading Completed');

        this.verifyUpload();
      },
    );
  }

  verifyUpload() {
    Logger.warn(
      ' ------------------------------------------------------------- ',
    );

    Logger.debug('Start Verify Uploaded');
    exec(
      'npx ts-node ../metaplex/js/packages/cli/src/candy-machine-v2-cli.ts verify_upload \
    -e devnet \
    -k ../keypair.json',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        Logger.log(`stdout: ${stdout}`);
        Logger.error(`stderr: ${stderr}`);
        Logger.debug('Finish Verify Uploaded');

        this.mintTokens();
      },
    );
  }

  mintTokens() {
    Logger.debug('Start Minting Tokens');

    exec(
      'npx ts-node ../metaplex/js/packages/cli/src/candy-machine-v2-cli.ts mint_one_token \
  -e devnet \
  -k ../keypair.json',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        Logger.log(`stdout: ${stdout}`);
        Logger.error(`stderr: ${stderr}`);
        Logger.debug('Finished Minting Tokens');
      },
    );
  }

  installNpdePackages() {
    Logger.debug('First run needs to install node_modules');
    Logger.debug('Start installing node_modules');
    Logger.debug('Wait . . . . . ');
    const vm = this;

    exec('(cd ../metaplex/js && yarn install)', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      Logger.log(`stdout: ${stdout}`);
      Logger.error(`stderr: ${stderr}`);
      Logger.debug('Installing Completed');
      this.updateWallet(this.wallet);

      //  verifyUpload();
    });
  }
}
