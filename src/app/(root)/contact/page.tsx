import Image from "next/image";
import Navigation from "../../components/Navigation";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/wallpaper-3.jpg"
            alt="Contact Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Liên Hệ
            </h1>
            <p className="text-xl text-white/90 drop-shadow-md">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-[#2c3e50] mb-8 text-center">
              Thông Tin Liên Hệ
            </h2>

            {/* Contact Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Address Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
                  Địa Chỉ
                </h3>
                <p className="text-[#654321] text-sm leading-relaxed">
                  123/9 Trần Huy Liệu
                  <br />
                  Phú Nhuận, TP.HCM
                </p>
              </div>

              {/* Phone Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
                  Điện Thoại
                </h3>
                <p className="text-[#654321] text-sm">
                  <a
                    href="tel:+84123456789"
                    className="hover:text-[#D4A047] transition-colors font-medium"
                  >
                    +84 123 456 789
                  </a>
                </p>
              </div>

              {/* Email Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
                  Email
                </h3>
                <p className="text-[#654321] text-sm">
                  <a
                    href="mailto:phuc.colorful@gmail.com"
                    className="hover:text-[#D4A047] transition-colors font-medium"
                  >
                    phuc.colorful@gmail.com
                  </a>
                </p>
              </div>

              {/* Hours Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
                  Giờ Làm Việc
                </h3>
                <p className="text-[#654321] text-sm leading-relaxed">
                  T2-T6: 8:00 - 20:00
                  <br />
                  T7-CN: 9:00 - 18:00
                </p>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div>
              <h3 className="text-2xl font-semibold text-[#2c3e50] mb-6 text-center">
                Vị Trí Cửa Hàng
              </h3>
              <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.2276817558964!2d106.67475027597803!3d10.793866258869935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752912887b356b%3A0x76225e986b4d4aa0!2zUGjDumMgTmd1eeG7hW4gR3VpdGFy!5e0!3m2!1svi!2s!4v1760364473675!5m2!1svi!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Phúc Nguyễn Guitar"
                ></iframe>
              </div>
              <p className="text-sm text-[#654321] mt-3 text-center">
                📍 Bản đồ tương tác - Click để xem chi tiết và chỉ đường
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
