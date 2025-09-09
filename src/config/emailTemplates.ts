import { getHelpInfo } from './helpLinks';

export interface EmailTemplateData {
  subcontractorName: string;
  projectName?: string;
  requirementName: string;
  documentTypeCode: string;
  dueDate?: string;
  uploadUrl: string;
  tenantName: string;
  tenantLogoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  attemptNumber?: number;
  escalationReason?: string;
}

export const EMAIL_TEMPLATES = {
  invite_initial: {
    subject: (data: EmailTemplateData) => 
      `Dokumentenanforderung: ${data.requirementName} für ${data.projectName || 'Compliance-Prüfung'}`,
    
    html: (data: EmailTemplateData) => `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dokumentenanforderung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #FF7A00; }
        .logo { max-height: 60px; margin-bottom: 10px; }
        .title { color: #2C5F5D; font-size: 24px; margin: 0; }
        .content { margin: 20px 0; }
        .highlight { background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF7A00; margin: 20px 0; }
        .cta-button { display: inline-block; background: #FF7A00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .help-section { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .contact-info { margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${data.tenantLogoUrl ? `<img src="${data.tenantLogoUrl}" alt="${data.tenantName}" class="logo">` : ''}
            <h1 class="title">${data.tenantName}</h1>
        </div>
        
        <div class="content">
            <h2>Dokumentenanforderung</h2>
            
            <p>Hallo ${data.subcontractorName},</p>
            
            <p>wir benötigen von Ihnen das folgende Dokument${data.projectName ? ` für das Projekt "${data.projectName}"` : ' für unsere Zusammenarbeit'}:</p>
            
            <div class="highlight">
                <strong>${data.requirementName}</strong>
                ${data.dueDate ? `<br><strong>Fällig bis:</strong> ${data.dueDate}` : ''}
            </div>
            
            <p>Bitte laden Sie das Dokument über den folgenden Link hoch:</p>
            
            <p style="text-align: center;">
                <a href="${data.uploadUrl}" class="cta-button">Jetzt Dokument hochladen</a>
            </p>
            
            ${getDocumentHelp(data.documentTypeCode)}
            
            <div class="contact-info">
                <p><strong>Bei Fragen erreichen Sie uns unter:</strong></p>
                ${data.contactEmail ? `<p>📧 E-Mail: <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>` : ''}
                ${data.contactPhone ? `<p>📞 Telefon: <a href="tel:${data.contactPhone}">${data.contactPhone}</a></p>` : ''}
            </div>
            
            <p>Vielen Dank für Ihre Kooperation!</p>
            <p>Mit freundlichen Grüßen<br>${data.tenantName}</p>
        </div>
        
        ${getEmailFooter()}
    </div>
</body>
</html>`
  },

  reminder_soft: {
    subject: (data: EmailTemplateData) => 
      `Erinnerung: ${data.requirementName} - Dokument noch ausstehend`,
    
    html: (data: EmailTemplateData) => `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Freundliche Erinnerung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #FFA726; }
        .logo { max-height: 60px; margin-bottom: 10px; }
        .title { color: #2C5F5D; font-size: 24px; margin: 0; }
        .content { margin: 20px 0; }
        .highlight { background-color: #fff8e1; padding: 15px; border-left: 4px solid #FFA726; margin: 20px 0; }
        .cta-button { display: inline-block; background: #FFA726; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${data.tenantLogoUrl ? `<img src="${data.tenantLogoUrl}" alt="${data.tenantName}" class="logo">` : ''}
            <h1 class="title">Freundliche Erinnerung</h1>
        </div>
        
        <div class="content">
            <p>Hallo ${data.subcontractorName},</p>
            
            <p>wir möchten Sie freundlich daran erinnern, dass wir noch das folgende Dokument von Ihnen benötigen:</p>
            
            <div class="highlight">
                <strong>${data.requirementName}</strong>
                ${data.dueDate ? `<br><strong>Fällig bis:</strong> ${data.dueDate}` : ''}
                ${data.attemptNumber ? `<br><small>Erinnerung Nr. ${data.attemptNumber}</small>` : ''}
            </div>
            
            <p>Falls Sie das Dokument bereits vorbereitet haben, können Sie es ganz einfach über den folgenden Link hochladen:</p>
            
            <p style="text-align: center;">
                <a href="${data.uploadUrl}" class="cta-button">Dokument jetzt hochladen</a>
            </p>
            
            ${getDocumentHelp(data.documentTypeCode)}
            
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
            <p>Mit freundlichen Grüßen<br>${data.tenantName}</p>
        </div>
        
        ${getEmailFooter()}
    </div>
</body>
</html>`
  },

  reminder_hard: {
    subject: (data: EmailTemplateData) => 
      `DRINGEND: ${data.requirementName} - Sofortige Vorlage erforderlich`,
    
    html: (data: EmailTemplateData) => `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dringende Mahnung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #F44336; }
        .logo { max-height: 60px; margin-bottom: 10px; }
        .title { color: #F44336; font-size: 24px; margin: 0; }
        .content { margin: 20px 0; }
        .highlight { background-color: #ffebee; padding: 15px; border-left: 4px solid #F44336; margin: 20px 0; }
        .cta-button { display: inline-block; background: #F44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .warning { background: #fff3e0; border: 1px solid #FF9800; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${data.tenantLogoUrl ? `<img src="${data.tenantLogoUrl}" alt="${data.tenantName}" class="logo">` : ''}
            <h1 class="title">⚠️ DRINGENDE MAHNUNG</h1>
        </div>
        
        <div class="content">
            <p>Sehr geehrte Damen und Herren von ${data.subcontractorName},</p>
            
            <p><strong>Trotz mehrfacher Aufforderung fehlt noch immer das folgende Dokument:</strong></p>
            
            <div class="highlight">
                <strong>${data.requirementName}</strong>
                ${data.dueDate ? `<br><strong>Fällig seit:</strong> ${data.dueDate}` : ''}
                <br><strong>Mahnung Nr. ${data.attemptNumber || 'X'}</strong>
            </div>
            
            <div class="warning">
                <strong>⚠️ WICHTIGER HINWEIS:</strong><br>
                Die Vorlage dieses Dokuments ist rechtlich verpflichtend. Ohne Nachweis können wir die Zusammenarbeit nicht fortsetzen.
            </div>
            
            <p><strong>Bitte laden Sie das Dokument UMGEHEND hoch:</strong></p>
            
            <p style="text-align: center;">
                <a href="${data.uploadUrl}" class="cta-button">🚨 SOFORT HOCHLADEN</a>
            </p>
            
            ${getDocumentHelp(data.documentTypeCode)}
            
            <p>Bei weiteren Verzögerungen müssen wir den Vorgang an die Projektleitung eskalieren.</p>
            
            <p>Mit freundlichen Grüßen<br>${data.tenantName}</p>
        </div>
        
        ${getEmailFooter()}
    </div>
</body>
</html>`
  },

  escalation: {
    subject: (data: EmailTemplateData) => 
      `ESKALATION: Fehlende Dokumente ${data.subcontractorName} - ${data.requirementName}`,
    
    html: (data: EmailTemplateData) => `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eskalation an Projektleitung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #D32F2F; }
        .logo { max-height: 60px; margin-bottom: 10px; }
        .title { color: #D32F2F; font-size: 24px; margin: 0; }
        .content { margin: 20px 0; }
        .highlight { background-color: #ffcdd2; padding: 15px; border-left: 4px solid #D32F2F; margin: 20px 0; }
        .escalation-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${data.tenantLogoUrl ? `<img src="${data.tenantLogoUrl}" alt="${data.tenantName}" class="logo">` : ''}
            <h1 class="title">🚨 ESKALATION PROJEKTLEITUNG</h1>
        </div>
        
        <div class="content">
            <p><strong>Betreff:</strong> Fehlende Compliance-Dokumente</p>
            
            <div class="highlight">
                <strong>Subunternehmer:</strong> ${data.subcontractorName}<br>
                <strong>Fehlendes Dokument:</strong> ${data.requirementName}<br>
                ${data.dueDate ? `<strong>Fällig seit:</strong> ${data.dueDate}<br>` : ''}
                <strong>Anzahl Erinnerungen:</strong> ${data.attemptNumber || 'Unbekannt'}
            </div>
            
            <p>Trotz ${data.attemptNumber || 'mehrfacher'} Erinnerungen wurde das oben genannte Dokument nicht eingereicht.</p>
            
            ${data.escalationReason ? `
            <div class="escalation-info">
                <strong>Eskalationsgrund:</strong><br>
                ${data.escalationReason}
            </div>
            ` : ''}
            
            <p><strong>Empfohlene Maßnahmen:</strong></p>
            <ul>
                <li>Direkte Kontaktaufnahme mit dem Subunternehmer</li>
                <li>Prüfung alternativer Nachweismöglichkeiten</li>
                <li>Ggf. Aussetzung der Zusammenarbeit bis zur Dokumentvorlage</li>
            </ul>
            
            <p><strong>Upload-Link für Subunternehmer:</strong><br>
            <a href="${data.uploadUrl}">${data.uploadUrl}</a></p>
            
            <p>Diese Nachricht wurde automatisch generiert und an alle Projektverantwortlichen gesendet.</p>
            
            <p>Mit freundlichen Grüßen<br>Compliance-System ${data.tenantName}</p>
        </div>
        
        ${getEmailFooter()}
    </div>
</body>
</html>`
  },

  monthly_refresh: {
    subject: (data: EmailTemplateData) => 
      `Monatliche Dokumentenprüfung - ${data.requirementName}`,
    
    html: (data: EmailTemplateData) => `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monatliche Dokumentenprüfung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2196F3; }
        .logo { max-height: 60px; margin-bottom: 10px; }
        .title { color: #2C5F5D; font-size: 24px; margin: 0; }
        .content { margin: 20px 0; }
        .highlight { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .cta-button { display: inline-block; background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .monthly-info { background: #f1f8e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${data.tenantLogoUrl ? `<img src="${data.tenantLogoUrl}" alt="${data.tenantName}" class="logo">` : ''}
            <h1 class="title">📋 Monatliche Dokumentenprüfung</h1>
        </div>
        
        <div class="content">
            <p>Hallo ${data.subcontractorName},</p>
            
            <p>im Rahmen unserer monatlichen Compliance-Prüfung benötigen wir eine Aktualisierung folgenden Dokuments:</p>
            
            <div class="highlight">
                <strong>${data.requirementName}</strong>
                ${data.dueDate ? `<br><strong>Aktualisierung bis:</strong> ${data.dueDate}` : ''}
            </div>
            
            <div class="monthly-info">
                <strong>📅 Monatliche Prüfung</strong><br>
                Dieses Dokument erfordert eine regelmäßige monatliche Aktualisierung zur Einhaltung der Compliance-Bestimmungen.
            </div>
            
            <p>Bitte laden Sie die aktuelle Version des Dokuments hoch:</p>
            
            <p style="text-align: center;">
                <a href="${data.uploadUrl}" class="cta-button">Aktuelles Dokument hochladen</a>
            </p>
            
            ${getDocumentHelp(data.documentTypeCode)}
            
            <p><strong>Hinweis:</strong> Falls sich seit dem letzten Monat nichts geändert hat, laden Sie bitte trotzdem eine aktuelle Bestätigung hoch.</p>
            
            <p>Vielen Dank für Ihre kontinuierliche Kooperation!</p>
            <p>Mit freundlichen Grüßen<br>${data.tenantName}</p>
        </div>
        
        ${getEmailFooter()}
    </div>
</body>
</html>`
  }
};

function getDocumentHelp(documentTypeCode: string): string {
  const helpInfo = getHelpInfo(documentTypeCode);
  
  if (helpInfo.url) {
    return `
    <div class="help-section">
        <h3>💡 Hilfe zu diesem Dokument:</h3>
        <p>${helpInfo.content}</p>
        <p><a href="${helpInfo.url}" target="_blank">📖 Weitere Informationen und Hilfe</a></p>
    </div>`;
  }
  
  return `
    <div class="help-section">
        <h3>💡 Hilfe zu diesem Dokument:</h3>
        <p>${helpInfo.content}</p>
    </div>`;
}

function getEmailFooter(): string {
  return `
    <div class="footer">
        <p><strong>Nachweis-Meister Compliance-System</strong></p>
        <p>Diese E-Mail wurde automatisch generiert. Bei technischen Problemen wenden Sie sich bitte an den Support.</p>
        <p>
            📚 <a href="https://www.bundesregierung.de/breg-de/themen/buerokratieabbau/gewerbeanmeldung-384746">Gewerbeschein-Info</a> |
            🔗 <a href="https://www.zoll.de/DE/Fachthemen/Arbeit/Mindestlohn/Anmeldung-Dienstleistung/anmeldung-dienstleistung_node.html">GZD-Anmeldung</a> |
            ℹ️ <a href="https://www.make-it-in-germany.com/de/visum-aufenthalt/arten/arbeit">Arbeitserlaubnis-Info</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
        <p style="text-align: center; color: #999; font-size: 11px;">
            © ${new Date().getFullYear()} Nachweis-Meister | Compliance-Management-System
        </p>
    </div>`;
}