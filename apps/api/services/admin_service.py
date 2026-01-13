import logging
from datetime import datetime, timedelta
from sqlalchemy import func, cast, Date, desc
from ..database import User as UserDB, PaymentDB, GenerationDB
from ..schemas import AdminAnalyticsResponse, DailyStat, AdminGenerationHistoryResponse, AdminGenerationHistoryItem, AdminGenerationUsage
from packages.billing.credits import get_credit_cost

logger = logging.getLogger(__name__)

class AdminAnalyticsService:
    @staticmethod
    def get_analytics(session) -> AdminAnalyticsResponse:
        # 1. Выручка (подтвержденные платежи)
        revenue_cents = session.query(func.sum(PaymentDB.amount)).filter(PaymentDB.status == "CONFIRMED").scalar() or 0
        revenue_rub = revenue_cents // 100
        
        # 2. Общее кол-во работ
        total_jobs = session.query(func.count(GenerationDB.id)).filter(GenerationDB.status != "DRAFT").scalar() or 0
        
        # 3. Затраты API
        total_tokens = session.query(func.sum(UserDB.tokens_used)).scalar() or 0
        api_costs_usd = (total_tokens / 1000) * 0.01
        
        # 4. Маржа
        costs_rub = api_costs_usd * 100
        margin_percent = int(((revenue_rub - costs_rub) / revenue_rub * 100)) if revenue_rub > 0 else 0
        
        # 5. Статистика по дням
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        daily_query = session.query(
            cast(GenerationDB.created_at, Date).label('date'),
            func.count(GenerationDB.id).label('jobs')
        ).filter(
            GenerationDB.created_at >= seven_days_ago,
            GenerationDB.status != "DRAFT"
        ).group_by(
            cast(GenerationDB.created_at, Date)
        ).all()
        
        daily_stats = [
            DailyStat(
                date=str(d.date),
                tokens=int(total_tokens / 30),
                jobs=d.jobs
            ) for d in daily_query
        ]
        
        return AdminAnalyticsResponse(
            revenueRub=revenue_rub,
            apiCostsUsd=round(api_costs_usd, 2),
            marginPercent=margin_percent,
            totalJobs=total_jobs,
            dailyStats=daily_stats
        )

    @staticmethod
    def get_generations_history(session) -> AdminGenerationHistoryResponse:
        query = session.query(
            GenerationDB, UserDB.email
        ).join(
            UserDB, GenerationDB.user_id == UserDB.id
        ).order_by(
            desc(GenerationDB.created_at)
        ).limit(100)
        
        results = query.all()
        
        items = []
        for db_gen, email in results:
            usage = db_gen.usage_metadata or []
            total_tokens = sum(u.get('tokens', 0) for u in usage)
            total_cost_usd = sum(u.get('cost_usd', 0.0) for u in usage)
            total_cost_rub = total_cost_usd * 100
            
            credit_cost = get_credit_cost(db_gen.work_type or "other")
            estimated_revenue_rub = credit_cost * 100
            estimated_profit_rub = estimated_revenue_rub - total_cost_rub
            
            items.append(AdminGenerationHistoryItem(
                id=db_gen.id,
                title=db_gen.title,
                module=db_gen.module,
                status=db_gen.status,
                created_at=db_gen.created_at,
                user_email=email,
                usage_metadata=[AdminGenerationUsage(**u) for u in usage],
                total_tokens=total_tokens,
                total_cost_rub=round(total_cost_rub, 2),
                estimated_revenue_rub=float(estimated_revenue_rub),
                estimated_profit_rub=round(estimated_profit_rub, 2)
            ))
            
        return AdminGenerationHistoryResponse(items=items)

admin_analytics_service = AdminAnalyticsService()


