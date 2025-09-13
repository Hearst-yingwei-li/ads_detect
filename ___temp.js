      function createDescription(html) {
        const paragraphMatches = [...descriptionHTML.matchAll(/<(p|li|h2|h3|h4|hr|figure|iframe)[^>]*>([\s\S]*?)<\/\1>/gi)];
        const meaningfulParagraphs = paragraphMatches.filter(match => {
            const tag = match[1].toLowerCase();
            const content = match[2].replace(/&nbsp;|\uFEFF|\s+/g, ''); // remove &nbsp;, zero-width space, and normal whitespace
            if (tag === "figure" || tag === "iframe") {
                return true;
            }
            return content.length > 0;
        });
        const paragraphCount = meaningfulParagraphs.length;
        if (paragraphCount > 0) {
          const container = document.createElement("div");
          container.style.boxSizing = "border-box";
          container.style.paddingLeft = "16px";
          container.style.paddingRight = "16px";
          container.style.display = "block";
          const inner = document.createElement("div");
          inner.style.boxSizing = "border-box";
          inner.style.display = "block";
          inner.innerHTML = html;

          // Style each <p> tag
          inner.querySelectorAll("p").forEach(p => {
            p.style.fontSize = "16px";
            p.style.lineHeight = "25.6px";
            p.style.marginTop = "16px";
            p.style.marginBottom = "16px";
            p.style.boxSizing = "border-box";
          });

          // Style each <li> tag
          inner.querySelectorAll('li').forEach(li => {
              li.style.fontSize = '16px';
              li.style.lineHeight = '25.6px';
              li.style.marginTop = '0px';
              li.style.marginBottom = '10px';
              li.style.boxSizing = 'border-box';
          });

          // Style <h2> tags
          inner.querySelectorAll('h2').forEach(h2 => {
              h2.style.fontSize = '24px'; 
              h2.style.lineHeight = '32px';
              h2.style.fontWeight = 'bold';
              h2.style.marginTop = '28px'; 
              h2.style.marginBottom = '10px';
              h2.style.boxSizing = 'border-box';
          });

          // Style <h3> tags
          inner.querySelectorAll('h3').forEach(h3 => {
              h3.style.fontSize = '18.72px'; 
              h3.style.lineHeight = '28px';
              h3.style.fontWeight = 'bold';
              h3.style.marginTop = '30px'; 
              h3.style.marginBottom = '30px';
              h3.style.boxSizing = 'border-box';
          });

          // Style <h4> tags
          inner.querySelectorAll('h4').forEach(h4 => {
              h4.style.fontSize = '16px'; 
              h4.style.lineHeight = '21px';
              h4.style.fontWeight = 'bold';
              h4.style.marginTop = '10px'; 
              h4.style.marginBottom = '10px';
              h4.style.boxSizing = 'border-box';
          });

          // Style <hr> tags
          inner.querySelectorAll('hr').forEach(hr => {
              hr.style.marginTop = '30px'; 
              hr.style.marginBottom = '30px';
              hr.style.boxSizing = 'border-box';
          });

          // Style <figure> tags
          inner.querySelectorAll('figure').forEach(fig => {
              fig.style.display = 'block';
              fig.style.marginTop = '16px';
              fig.style.marginBottom = '16px';
              fig.style.boxSizing = 'border-box';
              fig.style.width = '100%';
          });

          // Style <iframe> tags
          inner.querySelectorAll('iframe').forEach(frame => {
              frame.style.display = 'block';
              frame.style.maxWidth = '100%';
              frame.style.width = '100%';   // responsive
              frame.style.height = frame.getAttribute('height') || '281px';
              frame.style.marginTop = '10px';
              frame.style.marginBottom = '10px';
              frame.style.boxSizing = 'border-box';
          });

          container.appendChild(inner);
          return container;
        }
        return null;
      }