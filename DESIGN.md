---
name: Wisdom
description: Edumim-inspired Vietnamese learning marketplace in mint and coral.
colors: {"ink":"#0c1327","brand":"#117d72","cyan":"#ff7e84","coral":"#ff7e84","teal":"#30bead","muted":"#7b7b8a","line":"#e5e8eb","canvas":"#f7f9fa","soft":"#e8f8f5","white":"#ffffff","black":"#000000","primary-hover":"#f26973","loader-ring":"#4cbdff"}
typography: {"display":{"fontFamily":"Be Vietnam Pro, sans-serif","fontSize":"clamp(46px, 5.2vw, 74px)","fontWeight":800,"lineHeight":1.12,"letterSpacing":"-.035em"},"body":{"fontFamily":"Be Vietnam Pro, sans-serif","fontSize":"14px","fontWeight":400,"lineHeight":1.6},"heading":{"fontFamily":"Be Vietnam Pro, sans-serif","fontSize":"clamp(29px, 3vw, 42px)","fontWeight":800,"lineHeight":1.25}}
rounded: {"control":"7px","panel":"12px","hero":"14px","story":"18px"}
spacing: {"xs":"8px","sm":"12px","md":"24px","lg":"32px","xl":"48px","section":"80px"}
components: {"button-primary":{"backgroundColor":"{colors.coral}","textColor":"{colors.white}","rounded":"{rounded.control}","padding":"12px 22px"},"button-secondary":{"backgroundColor":"{colors.white}","textColor":"{colors.black}","rounded":"{rounded.control}","padding":"12px 22px"}}
---

## Overview
The user explicitly selected Edumim as the design reference and authorized new colors. This supersedes the former cyan/royal-blue theme. Keep Wisdom logos, mascot, Vietnamese copy, API data and role-based workflows. Direction contract: docs/edumim-direction.md.

## Colors
Coral actions use white text, as explicitly requested by the user. Accessible dark teal is used for links and selected surfaces; bright teal is decorative. Mint and blush reference backgrounds carry the homepage, course introduction, auth story and instructor CTA. Public footer is deep ink. Status colors retain their semantic roles. The legacy token named cyan now maps to coral for existing components.

## Typography
Use bundled Be Vietnam Pro with Vietnamese support. Large homepage headlines use 74px maximum, 48px on phones; course card titles 18px desktop and 19px mobile. Reading content uses 16px and 1.9 line-height.

## Layout
Public header contains logo, category tree, search and account avatar. Personal links are inside the avatar menu, with highlighted teaching and management links by role. Sidebars only appear on author/staff workspace routes. Homepage hero is split at desktop and stacked at mobile. Catalog has three columns desktop, two at tablet and one at mobile. Topics use four/three/two columns. Course editor retains category and price in the left half and upload preview in the right half; stacks below 760px.

## Elevation & Depth
Panels use thin borders. Menu shadow is 0 14px 42px #0c13271c; course cards use restrained 0 8px 24px #0c13270b depth. Modal shadow is 0 24px 80px #0c132726. No full-screen loading overlay for uploads.

## Shapes
Controls 7px, panels/cards 12px, course hero 14px, auth story 18px. Avatars circular. Keep course photography uncropped where used as an editorial composition.

## Components
Sources: src/styles/wisdom.css provides base structure; src/styles/edumim-theme.css is the final visual layer; src/styles/rich-text.css styles editor content. Morphicons drives category and avatar chevrons and upload completion; Motion handles avatar disclosure and gentle hero float. Both respect reduced motion. Radix Tooltip gives upload success hover/keyboard text. WisdomLoader uses the original source mascot and ring; fullscreen only for bootstrap/session/lazy routes, inline for query areas. Local file previews, upload progress and retries remain nonblocking for other fields.

## Do's and Don'ts
Do use real API counts, prices, cover images and reviews. Do preserve semantic forms, keyboard focus, category tree, permissions and responsive overflow. Do honor reduced motion. Do not copy sample endorsements, certification claims, course counts or testimonials from the reference. Do not replace all semantic state colors with decorative coral.
