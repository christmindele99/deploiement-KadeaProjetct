
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entrypoints of your application.
       * Each entrypoint will result in a separate bundle.
       */
      entryPoints: [
        'resources/css/app.css',
        'resources/js/app.js',
        'resources/js/auth/register.js',
        'resources/js/auth/reset_password.js',
        'resources/js/chat/index.js',
        'resources/js/chat/setting.js',
        'resources/js/chat/profile.js',
      ],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],
    }),
    tailwindcss(),
  ],

  server: {
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
})
