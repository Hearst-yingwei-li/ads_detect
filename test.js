const EmbedType = Object.freeze({
    IMAGE: 'image',
    INSTAGRAM: 'instagram',
    VIDEO: 'video',
    YOUTUBE: 'youbube',
    PINTEREST: 'pinterest',
    PRODUCTS: 'products',
});

function extractSlideDataFromDOM() {
    // 1. Check if 'listicle' radio is selected
    const selectedRadio = document.querySelector('input[name="display_type"]:checked');
    if (!selectedRadio || selectedRadio.getAttribute('data-display-type-name') !== 'listicle') {
        alert('リスティクルが選択されていません。');
        return;
    }

    // 2. Check if 'hide-breaker-ads' is checked
    const breakerAdsCheckbox = document.getElementById('hide-breaker-ads-checkbox');
    if (breakerAdsCheckbox && breakerAdsCheckbox.checked) {
        alert('「記事内挿入広告を非表示(PC&SP)」がチェックされていません。');
        return;
    }

    // 3. Check if 'hide-list-number' is checked
    const listNumberCheckbox = document.getElementById('hide-list-number-checkbox');
    const isHideListicleNo = listNumberCheckbox ? listNumberCheckbox.checked : false;

    const slides = document.querySelectorAll('.gallery-slide-items-container .gallery-item');
    const results = [];
    slides.forEach((slide, index) => {
        if (index === slides.length - 1) return;
        const embedType = getEmbedType(slide);
        console.log(`<<<<< slide :: ${index + 1} embed type ::${embedType}`);
        const slideId = slide.id;

        // 1. タイトル input (text value)
        const titleInput = slide.querySelector(`input[name*="[metadata][headline]"]`);
        const title = titleInput ? titleInput.value.trim() : '';

        // 2. リード content (keep <p> tags inside the editor)
        const leadEditor = slide.querySelector('.redactor-editor');
        const leadHTML = leadEditor ? leadEditor.innerHTML.trim() : '';

        const checkbox = slide.querySelector(`input[type="checkbox"][id*="skip-slide-numbering-${slideId}"]`);
        const isHideSlideNumber = checkbox ? checkbox.checked : false;

        // 3. image data
        // const img = slide.querySelector('img.edit');
        // const imageData = img
        //     ? {
        //         width: img.getAttribute('data-width'),
        //         height: img.getAttribute('data-height'),
        //         crop: img.getAttribute('data-selected-crop'),
        //     }
        //     : {};

        results.push({
            id: slideId,
            index: index + 1,
            hideListicleNo: isHideListicleNo,
            hideSlideNo: isHideSlideNumber,
            title: title,
            leadHTML: leadHTML,
            embedType: embedType,
            slideElement: slide
        });
    });
    return results;
}

function getEmbedType(slideElement) {
    if (isInstagramEmbed(slideElement)) return EmbedType.INSTAGRAM;
    if (isYoutubeEmbed(slideElement)) return EmbedType.YOUTUBE;
    if (isVideoEmbed(slideElement)) return EmbedType.VIDEO;
    if (isImageEmbed(slideElement)) return EmbedType.IMAGE;
    if (isPinterestEmbed(slideElement)) return EmbedType.PINTEREST;
    // TODO:products

    return null;
}

function isYoutubeEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('.drop-zone .embed');
    if (!embedDiv) return false;

    // Case 1: classList includes 'youtube'
    if (embedDiv.classList.contains('youtube')) {
        return true;
    }

    // Case 2: generic 'embed' class, check iframe src
    const iframe = embedDiv.querySelector('iframe');
    if (!iframe) return false;
    const src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
    return src.includes('youtube.com') || src.includes('youtu.be');
}

function isInstagramEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('.drop-zone .embed');
    if (!embedDiv) return false;
    if (embedDiv.classList.contains('instagram')) return true;
    const iframe = embedDiv.querySelector('iframe');
    if (!iframe) return false;
    // TODO: FIXME: instagram
    if (iframe.classList.contains('instagram-media')) return true;
    return false;
}

function isPinterestEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('.drop-zone .embed');
    if (!embedDiv) return false;
    if (embedDiv.classList.contains('pinterest')) return true;
    const iframe = embedDiv.querySelector('iframe');
    if (!iframe) return false;
    if (iframe.classList.contains('pinterest')) return true;
    return false;
}

function isVideoEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('.drop-zone .embed');
    if (!embedDiv) return false;

    const wrapperDiv = embedDiv.querySelector('div[class~="video-frame"]')
    if (wrapperDiv) {
        return true;
    }
    return false;
}

function isImageEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('img.edit');
    return embedDiv;
}

function getInstagramEmbedCode(slide) {
    const input = slide.slideElement.querySelector('input.gallery-metadata-url');
    const blockquoteHTML = input ? input.value : '';
    return blockquoteHTML;
}

function getVideoAspectRatio(slide) {
    const iframe = slide.slideElement.querySelector('iframe');
    const iframeSrc = iframe ? iframe.getAttribute('src') : null;
    const ratioMatch = iframeSrc.match(/aspect_ratio=(\d+):(\d+)/);
    if (!ratioMatch) return 0;
    const w = parseInt(ratioMatch[1], 10);
    const h = parseInt(ratioMatch[2], 10);
    if (!w || !h) return 0;
    return (h / w)
}

// function getYoutubeHTML(slide) {
//     const input = slide.slideElement.querySelector('input.gallery-metadata-url');
//     const watchUrl = input ? input.value : '';
//     const embedUrl = convertWatchToEmbedURL(watchUrl);
//     return embedUrl;
// }

// function convertWatchToEmbedURL(watchUrl) {
//     const match = watchUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
//     if (!match) return null;
//     const videoId = match[1];
//     return `https://www.youtube-nocookie.com/embed/${videoId}`;
// }


function calculateImageScreenHeight(slide) {
    const img = slide.slideElement.querySelector('img.edit');
    if (!img) return 0;
    const width = img.getAttribute('data-width');
    const height = img.getAttribute('data-height');
    const crop = img.getAttribute('data-selected-crop');
    if (!width || !height) return 0;

    if (crop && crop !== 'freeform') {
        const match = crop.match(/^(\d+)x(\d+)$/);
        if (match) {
            const w = parseInt(match[1]);
            const h = parseInt(match[2]);
            const cropRatio = h / w; // height-to-width ratio
            const croppedHeight = width * cropRatio;
            const scaledHeight = croppedHeight * (393 / width);
            return scaledHeight + 10;
        }
    }
    // margin bottom = 10
    return height * 393 / width + 10;
}

function injectPinterestScriptIfNeeded(callback) {
    // Check if Pinterest embed script is already loaded
    if (window.PinUtils && typeof window.PinUtils.build === 'function') {
        return callback(); // Already loaded
    }

    // Create the script
    const script = document.createElement('script');
    script.src = 'https://assets.pinterest.com/js/pinit_main.js'; // or pinit.js
    script.async = true;

    script.onload = () => {
        if (window.PinUtils && typeof window.PinUtils.build === 'function') {
            callback();
        } else {
            console.warn('Pinterest script loaded, but PinUtils is not available.');
        }
    };

    document.head.appendChild(script);
}

function renderPinterestEmbed(pinterestUrl) {
    const container = document.createElement('div');
    container.style.width = '393px'; // iPhone 16 width
    container.style.margin = '0 auto';
    container.style.border = '1px dashed #ccc';
    container.style.padding = '16px';
    container.style.position = 'relative';

    // Insert the Pinterest <a> element
    const pin = document.createElement('a');
    pin.setAttribute('data-pin-do', 'embedPin');
    pin.setAttribute('data-pin-width', 'medium'); // Optional: small | medium | large
    pin.setAttribute('href', pinterestUrl);
    container.appendChild(pin);

    document.body.appendChild(container); // Add to DOM before Pinterest renders

    injectPinterestScriptIfNeeded(() => {
        window.PinUtils.build(); // Trigger rendering
    });

    return container;
}


async function simulateLoopEmbedHeight(videoUrl) {
    // Convert to rendered CDN version if needed
    const convertedUrl = (() => {
        const match = videoUrl.match(/videos\/(.+\.mp4)/);
        if (!match) return videoUrl;
        return `https://media.hearstapps.net/loop/video/${match[1]}`;
    })();

    // Create hidden container
    const container = document.createElement('div');
    container.style.width = '393px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.visibility = 'hidden';

    // Create video element
    const video = document.createElement('video');
    video.src = convertedUrl;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.style.width = '100%';
    video.style.display = 'block';

    container.appendChild(video);
    document.body.appendChild(container);

    // Wait for metadata to load
    const embedHeight = await new Promise((resolve) => {
        let settled = false;

        const fallbackTimeout = setTimeout(() => {
            if (!settled) {
                settled = true;
                resolve(container.offsetHeight || 220); // fallback
            }
        }, 3000);

        video.addEventListener('loadedmetadata', () => {
            if (!settled) {
                settled = true;
                clearTimeout(fallbackTimeout);
                const aspectRatio = video.videoHeight / video.videoWidth;
                const height = 393 * aspectRatio;
                resolve(height);
            }
        });
    });

    // Clean up
    document.body.removeChild(container);

    return embedHeight;
}

async function simulateIPhoneChromeSlideOverflow(slide) {
    const wrapper = document.createElement('div');
    wrapper.style.width = '393px';
    wrapper.style.position = 'absolute';
    wrapper.style.visibility = 'hidden';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.fontFamily = `"Hiragino Kaku Gothic ProN", Meiryo, sans-serif`;
    wrapper.style.lineHeight = '1.5';
    wrapper.style.boxSizing = 'border-box';

    // Embed Element
    let embedHeight = 0;
    // TODO: For testing
    embedHeight = await simulateLoopEmbedHeight('https://hmg-dev.s3.amazonaws.com/videos/doechii-lead4-67f804fa3a8c6.mp4');
    const height = wrapper.offsetHeight + embedHeight + 16 * 2;
    console.log(`index:  ${slide.index}  total height ---- ${height}  wrapper height ---- ${wrapper.offsetHeight}  embededHeight height ----- ${embedHeight}`);

    return {
        height,
        overlapping: height < 670 - 40 // ads margin top:20 bottom:20
    };
}

(async function () {
    const slides = extractSlideDataFromDOM();
    if (!slides) {
        return;
    }

    let results = []
    for (const slide of slides) {
        const simulation = await simulateIPhoneChromeSlideOverflow(slide);
        results.push({
            slide: slide.index,
            height: simulation.height,
            overlapping: simulation.overlapping
        });
    }

    console.table(results);
    const overlappingSlides = results
        .filter(r => r.overlapping)
        .map(r => r.slide)
        .join(', ');

    const overlappingCount = overlappingSlides ? overlappingSlides.split(',').length : 0;
    if (overlappingCount > 0) {
        alert(`Audited ${results.length} slides.\n ${overlappingCount} overlapping.\nSlide index: ${overlappingSlides}`);
    }
})();
