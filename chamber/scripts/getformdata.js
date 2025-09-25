(function () {
      // Utility: safely get value from sources
      function getFromQueryOrStorage(key) {
        // 1) URL querystring
        const params = new URLSearchParams(window.location.search);
        if (params.has(key)) return params.get(key);

        // 2) sessionStorage (prefer sessionStorage for single-submission flow)
        try {
          const sessionRaw = sessionStorage.getItem('joinForm');
          if (sessionRaw) {
            const obj = JSON.parse(sessionRaw);
            if (obj && obj[key] != null) return obj[key];
          }
        } catch (e) { /* ignore parse errors */ }

        // 3) fallback to localStorage (if you stored form there)
        try {
          const localRaw = localStorage.getItem('joinForm');
          if (localRaw) {
            const obj = JSON.parse(localRaw);
            if (obj && obj[key] != null) return obj[key];
          }
        } catch (e) { /* ignore parse errors */ }

        return null;
      }

      // Pull required fields
      const requiredFields = [
        {key: 'firstName', label: 'First name'},
        {key: 'lastName', label: 'Last name'},
        {key: 'email', label: 'Email'},
        {key: 'mobile', label: 'Mobile number'},
        {key: 'business', label: 'Business name'},
        {key: 'timestamp', label: 'Submitted on'}
      ];

      // Try to find a more permissive set of keys for compatibility with different forms
      // e.g., some forms use "first" or "firstname" etc. We try a few common alternatives.
      function resolveKeyVariants(key) {
        const variants = {
          firstName: ['firstName', 'firstname', 'first', 'givenName'],
          lastName: ['lastName', 'lastname', 'last', 'surname', 'familyName'],
          email: ['email', 'emailAddress'],
          mobile: ['mobile', 'mobileNumber', 'phone', 'phoneNumber', 'tel'],
          business: ['business', 'businessName', 'company', 'organization'],
          timestamp: ['timestamp','submittedAt','date','submissionDate','currentDate']
        };
        return variants[key] || [key];
      }

      // Aggregate values
      const values = {};

      requiredFields.forEach(field => {
        const variants = resolveKeyVariants(field.key);
        let found = null;
        for (const v of variants) {
          const val = getFromQueryOrStorage(v);
          if (val !== null && val !== undefined && String(val).trim() !== '') {
            found = val;
            break;
          }
        }
        values[field.key] = found;
      });

      // Format mobile number (very small normalization)
      function formatPhone(raw) {
        if (!raw) return raw;
        const digits = raw.replace(/\D/g,'');
        if (digits.length === 10) {
          return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
        }
        return raw; // return original if not 10 digits
      }

      // Format timestamp to nice human-readable string if it looks parseable
      function formatTimestamp(raw) {
        if (!raw) return raw;
        // if numeric (epoch)
        if (/^\d+$/.test(raw)) {
          const n = Number(raw);
          // treat as seconds if length 10
          const ms = (String(raw).length === 10) ? n * 1000 : n;
          const d = new Date(ms);
          if (!isNaN(d)) return d.toLocaleString();
        }
        // try Date parse
        const d = new Date(raw);
        if (!isNaN(d)) return d.toLocaleString();
        // fallback: raw string
        return raw;
      }

      // Build the UI
      const container = document.getElementById('submissionArea');
      const actions = document.getElementById('actionButtons');
      const emailHint = document.getElementById('emailHint');

      // If at least one required field present, show a summary
      const hasAny = Object.values(values).some(v => v !== null && v !== undefined && String(v).trim() !== '');

      if (!hasAny) {
        container.innerHTML = '<div class="empty-note"><strong>No submission found.</strong> It looks like we didn\'t receive form data. If you just submitted the form, try returning to the <a href="./join.html">Join page</a> and submitting again. (If your form uses POST, consider redirecting to this page with query params or saving the submission into sessionStorage before redirect.)</div>';
        return;
      }

      // Build a definition list for required fields
      const dl = document.createElement('dl');
      dl.className = 'summary';

      requiredFields.forEach(f => {
        const value = values[f.key];
        const dt = document.createElement('dt');
        dt.textContent = f.label;

        const dd = document.createElement('dd');
        let displayValue = value;
        if (f.key === 'mobile') displayValue = formatPhone(value);
        if (f.key === 'timestamp') displayValue = formatTimestamp(value) || value;

        // If missing, mark as "Not provided"
        dd.textContent = (displayValue && String(displayValue).trim() !== '') ? displayValue : 'Not provided';

        dl.appendChild(dt);
        dl.appendChild(dd);
      });

      // Optionally show additional raw fields (non-required) if present in storage/url
      // e.g., show all other params the form submitted (nice for debugging)
      // Gather other params:
      const params = new URLSearchParams(window.location.search);
      const extras = [];
      params.forEach((v,k) => {
        // skip ones we already displayed (common variants)
        const already = requiredFields.some(f => resolveKeyVariants(f.key).includes(k));
        if (!already) extras.push({k,v});
      });
      // Also check stored object
      try {
        const sessionRaw = sessionStorage.getItem('joinForm');
        if (sessionRaw) {
          const obj = JSON.parse(sessionRaw);
          for (const k in obj) {
            const already = requiredFields.some(f => resolveKeyVariants(f.key).includes(k));
            if (!already && !params.has(k)) extras.push({k, v: obj[k]});
          }
        }
      } catch(e){}

      // Append everything
      container.appendChild(dl);

      if (extras.length) {
        const hr = document.createElement('hr');
        hr.style.margin = '1rem 0';
        container.appendChild(hr);

        const extrasTitle = document.createElement('h3');
        extrasTitle.textContent = 'Other submitted fields';
        extrasTitle.style.margin = '0 0 .5rem 0';
        extrasTitle.style.fontSize = '1rem';
        container.appendChild(extrasTitle);

        const extraDl = document.createElement('dl');
        extraDl.className = 'summary';

        extras.forEach(item => {
          const dt = document.createElement('dt');
          dt.textContent = item.k;
          const dd = document.createElement('dd');
          dd.textContent = String(item.v);
          extraDl.appendChild(dt);
          extraDl.appendChild(dd);
        });

        container.appendChild(extraDl);
      }

      // Show action buttons and hint
      actions.style.display = 'flex';
      // Only show email hint if email present
      if (values.email) emailHint.style.display = 'block';

      // Resend / Edit behavior: open join.html with the found values appended as querystring
      document.getElementById('resendBtn').addEventListener('click', function () {
        // Construct querystring from the values object
        const q = new URLSearchParams();
        // include all requiredFields (use common names)
        requiredFields.forEach(f => {
          const val = values[f.key];
          if (val != null) {
            // use the more canonical key names (firstName, lastName, email, mobile, business, timestamp)
            q.set(f.key, val);
          }
        });
        // also include extras from URL so they aren't lost
        const paramsCur = new URLSearchParams(window.location.search);
        paramsCur.forEach((v,k) => {
          if (!q.has(k)) q.set(k,v);
        });

        // open join.html with querystring (this allows editing)
        const target = './join.html?' + q.toString();
        window.location.href = target;
      });

      // Optionally clear session storage (if you used it)
      // sessionStorage.removeItem('joinForm');

    })();