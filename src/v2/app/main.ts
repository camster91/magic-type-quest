import { mountV2Shell } from './V2Shell';
import './v2.css';

const root = document.getElementById('v2-app');
if (!root) throw new Error('Nature Quest root is missing.');

const dispose = mountV2Shell(root);
window.addEventListener('pagehide', dispose, { once: true });
