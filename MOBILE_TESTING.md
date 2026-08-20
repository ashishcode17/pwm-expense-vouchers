# Mobile Testing Guide - PWM Expense Vouchers

## Quick Mobile Testing Options

### Option 1: Local Network (Same WiFi) ⚡ FASTEST

**Requirements**: Phone and computer on same WiFi

1. **Find your computer's IP address:**
   ```bash
   # Mac/Linux
   hostname -I | awk '{print $1}'
   # or
   ipconfig getifaddr en0
   
   # Windows PowerShell
   ipconfig | findstr IPv4
   ```
   Example output: `192.168.1.100`

2. **Start dev server on all interfaces:**
   ```bash
   cd /agent/pwm-expense-vouchers
   npm run dev -- -H 0.0.0.0 -p 3000
   ```

3. **Access from phone:**
   - Open browser on phone
   - Go to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

---

### Option 2: ngrok Tunnel (Any Network) 🌐

**Use this if**: Different WiFi or testing remotely

1. **Install ngrok:**
   ```bash
   # Mac (with Homebrew)
   brew install ngrok
   
   # Linux
   wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
   tar -xvf ngrok-v3-stable-linux-amd64.tgz
   sudo mv ngrok /usr/local/bin/
   
   # Or download from: https://ngrok.com/download
   ```

2. **Start your app:**
   ```bash
   cd /agent/pwm-expense-vouchers
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok output:
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Open that URL on your phone!**

**Note**: Free ngrok URLs expire when you close the tunnel. Pro accounts get permanent URLs.

---

### Option 3: Deploy to Vercel (Production Testing) 🚀

**Best for**: Sharing with team, permanent testing URL

1. **Push to GitHub:**
   ```bash
   cd /agent/pwm-expense-vouchers
   # Create repo on github.com first, then:
   git remote add origin https://github.com/YOUR_USERNAME/pwm-vouchers.git
   git push -u origin cursor/pwm-expense-vouchers-complete-7202
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repo
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Access from anywhere:**
   - You'll get a URL like: `https://pwm-vouchers.vercel.app`
   - Works on any device, anywhere

---

## Mobile Testing Checklist

Test these features on your phone:

### Basic Navigation
- [ ] Login page loads properly
- [ ] Dashboard is readable and scrollable
- [ ] Sidebar menu works (or hamburger menu if implemented)
- [ ] All pages accessible

### Voucher Creation
- [ ] Form fields are easy to tap
- [ ] Numeric keyboard appears for amount field
- [ ] Date picker works
- [ ] Dropdowns are usable
- [ ] Amount converts to words
- [ ] Camera/photo upload works for receipts
- [ ] Form validation shows errors
- [ ] Submit button works

### Voucher View
- [ ] Voucher displays properly
- [ ] All information readable
- [ ] Print button behavior (may open print dialog)
- [ ] Download PDF works
- [ ] Receipt thumbnail shows if attached

### Expense Register
- [ ] Table scrolls horizontally if needed
- [ ] Filters work
- [ ] Search is functional
- [ ] Quick filter buttons work
- [ ] CSV export works

### Reports
- [ ] Charts display correctly
- [ ] Month selector works
- [ ] Data is readable

### Settings
- [ ] Forms are usable
- [ ] Tabs switch properly
- [ ] Add/Edit dialogs work
- [ ] Buttons are tap-friendly

### Performance
- [ ] Pages load quickly
- [ ] No layout shifts
- [ ] Smooth scrolling
- [ ] No horizontal overflow

---

## Troubleshooting

### "Can't reach the site" on phone

**Problem**: Phone can't connect to `http://192.168.1.100:3000`

**Solutions**:
1. Check both devices are on same WiFi
2. Check computer firewall allows port 3000
3. Make sure dev server is running with `-H 0.0.0.0`
4. Try computer's WiFi IP (not ethernet IP)

**Mac Firewall**:
- System Preferences → Security & Privacy → Firewall
- Click "Firewall Options"
- Allow "node" or temporarily disable firewall

**Windows Firewall**:
```powershell
netsh advfirewall firewall add rule name="Next.js Dev" dir=in action=allow protocol=TCP localport=3000
```

### Layout looks broken on mobile

**Solutions**:
1. Hard refresh: Hold refresh button → "Hard Reload"
2. Clear cache in mobile browser
3. Check browser console for errors
4. Try in private/incognito mode

### Touch targets too small

The app is designed with mobile in mind, but if buttons are hard to tap:
1. Zoom in to check if it's just initial scale
2. Report specific screens that need adjustment

### Camera upload not working

**iOS Safari**:
- Needs HTTPS or localhost
- Use ngrok for HTTPS testing
- Or test file picker with existing photos

**Android Chrome**:
- Should work over HTTP on local network
- Check camera permissions in browser settings

---

## Quick Commands Reference

```bash
# Local network testing
npm run dev -- -H 0.0.0.0

# Find your IP
hostname -I | awk '{print $1}'

# Test with ngrok
ngrok http 3000

# Build for production testing
npm run build
npm start
```

---

## Mobile Browser Testing Matrix

### Recommended Browsers

| OS | Browser | Status |
|---|---|---|
| iOS | Safari | ✅ Primary |
| iOS | Chrome | ✅ Works |
| Android | Chrome | ✅ Primary |
| Android | Firefox | ✅ Works |
| Android | Samsung Internet | ✅ Works |

---

## Security Note for Network Testing

When testing on local network:
- Your app is accessible to anyone on same WiFi
- Don't use real production data
- Use test credentials only
- Stop the server when done testing

For production, always deploy to HTTPS (Vercel/Netlify).

---

## Need Help?

1. Check firewall settings
2. Verify same WiFi network
3. Try ngrok if local network fails
4. Check browser console for errors
5. Test with different mobile browsers

Happy mobile testing! 📱
