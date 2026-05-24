import Auth from '@/components/auth/Auth';

export const metadata = {
  title: 'Đăng Nhập - GreenLife',
  description: 'Đăng nhập vào tài khoản GreenLife của bạn để quản lý giỏ hàng và xem tư vấn cây xanh.',
};

export default function LoginPage() {
  return <Auth initialMode="login" />;
}
