import {
  Command
} from '@tauri-apps/plugin-shell';

let backendStarted = false;

export async function startBackend() {

  if (backendStarted) {
    return;
  }

  try {

    const command = Command.create(

      'cmd',

      [

        '/C',

        'node backend/dist/server.js'
      ]
    );

    command.stdout.on(

      'data',

      line => {

        console.log(
          '[BACKEND]',
          line
        );
      }
    );

    command.stderr.on(

      'data',

      line => {

        console.error(
          '[BACKEND ERROR]',
          line
        );
      }
    );

    await command.spawn();

    backendStarted = true;

    console.log(
      '✅ Backend démarré automatiquement'
    );

  } catch (error) {

    console.error(
      '❌ Erreur backend',
      error
    );
  }
}