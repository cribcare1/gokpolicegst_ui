"use client";
import Layout from '@/components/shared/Layout';
import ProfileMaster from '@/components/master-data/ProfileMaster';

export default function ProfilePage() {
  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="gradient-text">Profile Master</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)]">
            Manage Wings E-business Services profile information
          </p>
        </div>

        <ProfileMaster />
      </div>
    </Layout>
  );
}

