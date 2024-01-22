/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// Composables
import {createVuetify} from 'vuetify';
import {VBtn} from 'vuetify/components/VBtn';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
    defaults: {
        VBtn: {
            color: 'green', //'rgba(70, 202, 139, 1)',
            class: 'text-white',
            style: 'text-transform: none;',
        },
    },
});
