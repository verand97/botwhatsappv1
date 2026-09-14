import { parseSlideRequest, getYouTubeInfo, downloadMediaFromUrl } from '../lib/bot/mediaDownloader';

async function test() {
  console.log('--- 1. Testing parseSlideRequest / parseMediaRequest ---');

  const test1 = parseSlideRequest('.yt https://www.youtube.com/watch?v=dQw4w9WgXcQ 1080');
  console.log('Test 1 (.yt <url> 1080):', test1?.resolution === '1080' ? 'PASSED (1080)' : 'FAILED', test1);

  const test2 = parseSlideRequest('.yt 720 https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  console.log('Test 2 (.yt 720 <url>):', test2?.resolution === '720' ? 'PASSED (720)' : 'FAILED', test2);

  const test3 = parseSlideRequest('.yt https://www.youtube.com/watch?v=dQw4w9WgXcQ 480p');
  console.log('Test 3 (.yt <url> 480p):', test3?.resolution === '480' ? 'PASSED (480)' : 'FAILED', test3);

  const test4 = parseSlideRequest('.yt https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  console.log('Test 4 (.yt <url> without res):', test4?.resolution === undefined ? 'PASSED (undefined)' : 'FAILED', test4);

  const testSlide = parseSlideRequest('.dl https://vt.tiktok.com/ZSN123/ 2');
  console.log('Test Slide (.dl <url> 2):', testSlide?.slideIndices?.[0] === 2 ? 'PASSED (slide 2)' : 'FAILED', testSlide);

  console.log('\n--- 2. Testing getYouTubeInfo ---');
  const ytUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const info = await getYouTubeInfo(ytUrl);
  console.log('getYouTubeInfo result:', info);

  console.log('\n--- 3. Testing downloadMediaFromUrl with resolution: 480 ---');
  const downloadResult = await downloadMediaFromUrl(ytUrl, { resolution: '480' });
  console.log('Download success:', downloadResult.success);
  console.log('Download platform:', downloadResult.platform);
  console.log('Download type:', downloadResult.type);
  console.log('Download resolution:', downloadResult.resolution);
  console.log('Buffer bytes:', downloadResult.buffer?.length);
  console.log('Caption snippet:\n', downloadResult.caption);

  console.log('\nALL YOUTUBE RESOLUTION TESTS COMPLETED!');
}

test().catch(console.error);
