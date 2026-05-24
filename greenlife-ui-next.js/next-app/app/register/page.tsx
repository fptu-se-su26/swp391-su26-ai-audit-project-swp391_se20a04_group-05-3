import Auth from '@/components/auth/Auth';

export const metadata = {
  title: 'Đăng Ký - GreenLife',
  description: 'Tạo tài khoản GreenLife mới để mua sắm cây cảnh và nhận tư vấn sức khỏe cây trồng bằng AI.',
};

export default function RegisterPage() {
  return <Auth initialMode="register" />;
}
