import { mount } from 'svelte';
import '@pkg/styles';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
