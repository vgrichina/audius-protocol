"use strict";

var React = require('react');

var BodyStyles = function BodyStyles() {
  return React.createElement("style", {
    type: "text/css",
    dangerouslySetInnerHTML: {
      __html: "\n    html {\n      margin: 0;\n      padding: 0;\n    }\n\n    body {\n      margin: 0;\n      padding: 0;\n    }\n\n    p {\n      margin: 1em 0;\n      padding: 0;\n    }\n\n    a {\n      color: #8F2CE8;\n    }\n\n    table {\n      border-collapse: collapse;\n    }\n\n    h1,\n    h2,\n    h3,\n    h4,\n    h5,\n    h6 {\n      display: block;\n      margin: 0;\n      padding: 0;\n    }\n\n    img,\n    a img {\n      border: 0;\n      height: auto;\n      outline: none;\n      text-decoration: none;\n    }\n\n    h2 {\n      color: #858199;\n      font-size: 32px;\n      font-weight: bold;\n      letter-spacing: .02px;\n      text-align: center;\n      margin: 0 auto;\n    }\n\n    h3 {\n      color: #C3C0CC;\n      font-size: 16px;\n      font-weight: bold;\n      letter-spacing: .02px;\n      line-height: 25px;\n      text-align: center;\n      /* margin-bottom: 10px; */\n    }\n\n    .pink {\n      color: #E000DB;\n    }\n\n    .purple {\n      color: #7E1BCC;\n    }\n\n    body,\n    #bodyTable,\n    #bodyCell {\n      height: 100%;\n      margin: 0;\n      padding: 0;\n      width: 100%;\n      background: #FFFFFF;\n      font-family: \"Avenir Next LT Pro\", Helvetica, Arial, sans-serif;\n    }\n\n    #outlook a {\n      padding: 0;\n    }\n\n    img {\n      -ms-interpolation-mode: bicubic;\n    }\n\n    table {\n      mso-table-lspace: 0;\n      mso-table-rspace: 0;\n    }\n\n    .ReadMsgBody {\n      width: 100%;\n    }\n\n    .ExternalClass {\n      width: 100%;\n    }\n\n    p,\n    a,\n    li,\n    td,\n    blockquote {\n      mso-line-height-rule: exactly;\n    }\n\n    p,\n    a,\n    li,\n    td,\n    body,\n    table,\n    blockquote {\n      -ms-text-size-adjust: 100%;\n      -webkit-text-size-adjust: 100%;\n    }\n\n    .button {\n      background: #E000DB;\n      font-size: 24px !important;\n      color: #FFFFFF !important;\n      font-weight: 700 !important;\n      letter-spacing: 0.03px !important;\n      text-decoration: none !important;\n      user-select: none;\n      cursor: pointer;\n      line-height: 29px;\n      border-radius: 8px;\n      text-align: center;\n      display: inline-block;\n      padding: 16px 32px;\n    }\n\n    .ExternalClass,\n    .ExternalClass p,\n    .ExternalClass td,\n    .ExternalClass div,\n    .ExternalClass span,\n    .ExternalClass font {\n      line-height: 100%;\n    }\n\n    .templateImage {\n      height: auto;\n      max-width: 564px;\n    }\n\n    #footerContent {\n      padding-top: 27px;\n      padding-bottom: 18px;\n    }\n\n    #templateBody {\n      padding-right: 94px;\n      padding-left: 94px;\n    }\n\n    .notificationsContainer {\n      max-width: 396px;\n      margin-bottom: 32px;\n    }\n      \n    .seeMoreOnAudius {\n      padding: 8px 24px;\n      border-radius: 17px;\n      background-color: #7E1BCC;\n      margin-bottom: 0px auto 32px;\n    color: #FFFFFF;\n    font-family: \"Avenir Next LT Pro\";\n    font-size: 14px;\n    font-weight: bold;\n    letter-spacing: 0.15px;\n    text-align: center;\n    }\n\n      \n    .footerContainer {\n      width: 100%;\n    }\n\n    .footerContainer table {\n      table-layout: fixed;\n    }\n\n    #templateHeader {\n      background-color: #FFFFFF;\n      background-image: none;\n      background-repeat: no-repeat;\n      background-position: center;\n      background-size: cover;\n      border-top: 0;\n      border-bottom: 0;\n      padding-bottom: 0;\n      border-radius: 8px 8px 0px 0px;\n    }\n\n    #templateHeader a,\n    #templateHeader p a {\n      color: #237A91;\n      font-weight: normal;\n      text-decoration: underline;\n    }\n\n    #templateBody {\n      background-color: #FFFFFF;\n      margin-bottom: 44px;\n      padding-bottom: 36px;\n      height: 100%;\n      width: 100%;\n      max-width: 720px;\n      border-radius: 0 0 8px 8px;\n      box-shadow: 0 16px 20px 0 rgba(232, 228, 234, 0.5);\n    }\n\n    #templateBody,\n    #templateBody p {\n      color: #858199;\n      font-size: 18px;\n      letter-spacing: .02px;\n      line-height: 25px;\n      text-align: center;\n    }\n\n    #templateBody a,\n    #templateBody p a {\n      color: #7E1BCC;\n      font-weight: normal;\n      text-decoration: underline;\n    }\n\n    #templateFooter {\n      border-top: 1px solid #DAD9E0;\n      width: 100%;\n      padding: 0;\n      background-color: #fbfbfc;\n    }\n\n    #socialBar img {\n      height: 24px;\n      width: 24px;\n      padding: 0 20px;\n    }\n    #socialBar a:first-child img {\n      padding: 0 20px 0 0;\n    }\n\n    #socialBar,\n    #socialBar p {\n      color: #C2C0CC;\n      font-size: 16px;\n      font-weight: bold;\n      letter-spacing: .2px;\n      text-align: center;\n    }\n\n    #templateFooter,\n    #templateFooter p {\n      color: #858199;\n      font-family: \"Gilroy\", \"Avenir Next LT Pro\", Helvetica, Arial, sans-serif;\n      font-size: 14px;\n      line-height: 20px;\n      text-align: center;\n    }\n\n    #templateFooter a,\n    #templateFooter p a {\n      vertical-align: bottom;\n      color: #656565;\n      font-weight: normal;\n      text-decoration: underline;\n    }\n\n    #utilityBar {\n      border: 0;\n      padding-top: 9px;\n      padding-bottom: 9px;\n    }\n\n    #utilityBar,\n    #utilityBar p {\n      color: #C2C0CC;\n      font-size: 12px;\n      line-height: 150%;\n      text-align: center;\n    }\n\n    #utilityBar a,\n    #utilityBar p a {\n      color: #C2C0CC;\n      font-weight: normal;\n      text-decoration: underline;\n    }\n\n    .arrowIcon {\n      opacity: 0.5;\n    }\n\n    .arrowIcon path {\n      fill: #858199;\n    }\n\n    @media (max-width: 720px) {\n\n      body,\n      table,\n      td,\n      p,\n      a,\n      li,\n      blockquote {\n        -webkit-text-size-adjust: none !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      .button {\n        padding: 16px 24px;\n      }\n    }\n\n    @media (max-width: 720px) {\n      body {\n        width: 100% !important;\n        min-width: 100% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      .templateImage {\n        width: 100% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      .columnContainer {\n        max-width: 100% !important;\n        width: 100% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      .mobileHide {\n        display: none;\n      }\n    }\n\n    @media (max-width: 720px) {\n      .utilityLink {\n        display: block;\n        padding: 9px 0;\n      }\n    }\n\n    @media (max-width: 720px) {\n      h1 {\n        font-size: 22px !important;\n        line-height: 175% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      h4 {\n        font-size: 16px !important;\n        line-height: 175% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      p {\n        font-size: 16px !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n\n      #templateHeader,\n      #templateHeader p {\n        font-size: 16px !important;\n        line-height: 150% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      #bodyCell {\n        text-align: center;\n      }\n    }\n\n    @media (max-width: 720px) {\n      .templateContainer {\n        display: table !important;\n        max-width: 384px !important;\n        width: 80% !important;\n        margin-left: auto !important;\n        margin-right: auto !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      #templateBody {\n        padding-right: 13px !important;\n        padding-left: 13px !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n\n      #templateBody,\n      #templateBody p {\n        font-size: 16px !important;\n        line-height: 150% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n      .footerContainer table td {\n        /* display: block; */\n      }\n    }\n\n    @media (max-width: 720px) {\n\n      #templateFooter,\n      #templateFooter p {\n        font-size: 14px !important;\n        line-height: 150% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n\n      #socialBar,\n      #socialBar p {\n        font-size: 14px !important;\n        line-height: 150% !important;\n      }\n    }\n\n    @media (max-width: 720px) {\n\n      #utilityBar,\n      #utilityBar p {\n        font-size: 14px !important;\n        line-height: 150% !important;\n      }\n    }\n  "
    }
  });
};

module.exports = BodyStyles;