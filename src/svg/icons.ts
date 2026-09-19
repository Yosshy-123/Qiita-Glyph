/**
 * Third-party icon artwork; see /NOTICE for attribution and license
 * details for each icon.
 */
export type IconRenderer = (color: string) => string;

export const postsIconSvg: IconRenderer = (color) => `
    <g transform="scale(1.3)">
      <path
        d="M15 8H17M15 12H17M17 16H7M7 8V12H11V8H7ZM5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20Z"
        stroke="${color}"
        fill="transparent"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
      />
    </g>
  `;

export const heartIconSvg: IconRenderer = (color) => `
    <g transform="scale(1.3)">
      <path
        d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
        stroke="${color}"
        fill="transparent"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  `;

export const bookmarkIconSvg: IconRenderer = (color) => `
    <g transform="scale(1.3)">
      <path
        d="M6.09 21.06a1 1 0 0 1-1-1L4.94 5.4a2.26 2.26 0 0 1 2.18-2.35L16.71 3a2.27 2.27 0 0 1 2.23 2.31l.14 14.66a1 1 0 0 1-.49.87 1 1 0 0 1-1 0l-5.7-3.16-5.29 3.23a1.2 1.2 0 0 1-.51.15zm5.76-5.55a1.11 1.11 0 0 1 .5.12l4.71 2.61-.12-12.95c0-.2-.13-.34-.21-.33l-9.6.09c-.08 0-.19.13-.19.33l.12 12.9 4.28-2.63a1.06 1.06 0 0 1 .51-.14z"
        fill="${color}"
      />
    </g>
  `;

export const userIconSvg: IconRenderer = (color) => `
    <g transform="scale(1.3)">
      <path d="M4 21C4 17.4735 6.60771 14.5561 10 14.0709
               M16.4976 16.2119C15.7978 15.4328 14.6309 15.2232 13.7541 15.9367
               C12.8774 16.6501 12.7539 17.843 13.4425 18.6868
               C13.8312 19.1632 14.7548 19.9983 15.4854 20.6353
               C15.8319 20.9374 16.0051 21.0885 16.2147 21.1503
               C16.3934 21.203 16.6018 21.203 16.7805 21.1503
               C16.9901 21.0885 17.1633 20.9374 17.5098 20.6353
               C18.2404 19.9983 19.164 19.1632 19.5527 18.6868
               C20.2413 17.843 20.1329 16.6426 19.2411 15.9367
               C18.3492 15.2307 17.1974 15.4328 16.4976 16.2119
               M15 7C15 9.20914 13.2091 11 11 11
               C8.79086 11 7 9.20914 7 7
               C7 4.79086 8.79086 3 11 3
               C13.2091 3 15 4.79086 15 7Z"
        stroke="${color}"
        fill="transparent"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"/>
    </g>
  `;
