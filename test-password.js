const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

async function testPassword() {
  try {
    // 验证现有哈希
    const isValid = await bcrypt.compare(password, hash);
    console.log('验证现有哈希:', isValid);

    // 生成新的哈希
    const newHash = await bcrypt.hash(password, 10);
    console.log('新生成的哈希:', newHash);

    // 验证新生成的哈希
    const isValidNew = await bcrypt.compare(password, newHash);
    console.log('验证新生成的哈希:', isValidNew);
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testPassword(); 