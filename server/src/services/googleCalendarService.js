const { google } = require('googleapis');

const getClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback/google'
    );
};

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email'];

exports.getAuthUrl = (state) => {
    const client = getClient();
    return client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state // Pass JWT or userId to associate on callback
    });
};

exports.getTokensFromCode = async (code) => {
    const client = getClient();
    const { tokens } = await client.getToken(code);
    return tokens;
};

exports.getCalendarEvents = async (tokens, timeMin, timeMax) => {
    const client = getClient();
    client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: client });
    
    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
    });
    
    return response.data.items;
};
