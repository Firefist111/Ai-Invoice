import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const navigate = useNavigate();

    const plans = [
        {
            name: 'Starter',
            description: 'Perfect for freelancers and small projects',
            monthlyPrice: 0,
            annualPrice: 0,
            features: [
                '5 invoices per month',
                'Basic AI parsing',
                'Standard templates',
                'Email support',
                'PDF export'
            ],
            cta: 'Sign in to get started',
            popular: false
        },
        {
            name: 'Professional',
            description: 'For growing businesses and agencies',
            monthlyPrice: 499,
            annualPrice: 399,
            features: [
                'Unlimited invoices',
                'Advanced AI parsing',
                'Custom branding',
                'Priority support',
                'Advanced analytics',
                'Team collaboration (3 members)',
                'API access'
            ],
            cta: 'Sign in to get started',
            popular: true
        },
        {
            name: 'Enterprise',
            description: 'For large organizations with custom needs',
            monthlyPrice: 1499,
            annualPrice: 1199,
            features: [
                'Everything in Professional',
                'Unlimited team members',
                'Custom workflows',
                'Dedicated account manager',
                'SLA guarantee',
                'White-label solutions',
                'Advanced security'
            ],
            cta: 'Sign in to get started',
            popular: false
        }
    ];

    return (
        <section id="pricing" className="relative py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-20 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Simple, Fair Pricing
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        Start free, upgrade as you grow. No hidden fees, no surprise charges.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 p-1.5 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${billingCycle === 'monthly'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 relative ${billingCycle === 'annual'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Annual
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                                Save 20%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 ${plan.popular
                                    ? 'border-blue-500 shadow-2xl scale-105 z-10'
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-xl'
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-full shadow-lg">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <p className="text-sm text-gray-600">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-8">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        ₹{billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                                    </span>
                                    <span className="text-gray-600">/month</span>
                                </div>
                                {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Billed annually (₹{plan.annualPrice * 12})
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => navigate('/signUp')}
                                className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${plan.popular
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                                    }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* All Plans Include */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">All plans include</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            'Secure cloud storage',
                            'Mobile-friendly interface',
                            'Automatic backups',
                            'Real-time notifications',
                            'Multi-currency support',
                            'Tax calculation'
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-gray-700">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Sales */}
                <div className="text-center mt-12">
                    <p className="text-gray-600">
                        Have questions about pricing?{' '}
                        <a href="#contact" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            Contact our sales team →
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
