use anchor_lang::prelude::*;

declare_id!("HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam");

#[program]
pub mod skillguard {
    use super::*;

    pub fn create_user_profile(ctx: Context<CreateUserProfile>) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.owner = ctx.accounts.owner.key();
        user_profile.bump = ctx.bumps.user_profile;

        Ok(())
    }

    pub fn connect_agent(ctx: Context<ConnectAgent>, agent_id_hash: [u8; 32]) -> Result<()> {
        let agent_connection = &mut ctx.accounts.agent_connection;
        agent_connection.owner = ctx.accounts.owner.key();
        agent_connection.agent_id_hash = agent_id_hash;
        agent_connection.active = true;
        agent_connection.revoked = false;
        agent_connection.bump = ctx.bumps.agent_connection;

        Ok(())
    }

    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        agent_id_hash: [u8; 32],
        max_spend_atomic: u64,
        allowed_network_hash: [u8; 32],
        allowed_protocols_hash: [u8; 32],
        expires_at: i64,
    ) -> Result<()> {
        require!(
            ctx.accounts.agent_connection.active && !ctx.accounts.agent_connection.revoked,
            SkillGuardError::AgentConnectionInactive
        );

        let agent_policy = &mut ctx.accounts.agent_policy;
        agent_policy.owner = ctx.accounts.owner.key();
        agent_policy.agent_id_hash = agent_id_hash;
        agent_policy.max_spend_atomic = max_spend_atomic;
        agent_policy.allowed_network_hash = allowed_network_hash;
        agent_policy.allowed_protocols_hash = allowed_protocols_hash;
        agent_policy.expires_at = expires_at;
        agent_policy.active = true;
        agent_policy.bump = ctx.bumps.agent_policy;

        Ok(())
    }

    pub fn revoke_agent(ctx: Context<RevokeAgent>, _agent_id_hash: [u8; 32]) -> Result<()> {
        let agent_connection = &mut ctx.accounts.agent_connection;
        agent_connection.active = false;
        agent_connection.revoked = true;

        Ok(())
    }

    pub fn record_decision(
        ctx: Context<RecordDecision>,
        agent_id_hash: [u8; 32],
        action_id_hash: [u8; 32],
        manifest_hash: [u8; 32],
        decision: u8,
        policy_result_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            ctx.accounts.agent_connection.active && !ctx.accounts.agent_connection.revoked,
            SkillGuardError::AgentConnectionInactive
        );
        require!(
            decision == DecisionCode::Approved as u8 || decision == DecisionCode::Rejected as u8,
            SkillGuardError::InvalidDecisionCode
        );

        let action_receipt = &mut ctx.accounts.action_receipt;
        action_receipt.owner = ctx.accounts.owner.key();
        action_receipt.agent_id_hash = agent_id_hash;
        action_receipt.action_id_hash = action_id_hash;
        action_receipt.manifest_hash = manifest_hash;
        action_receipt.decision = decision;
        action_receipt.policy_result_hash = policy_result_hash;
        action_receipt.execution_signature_hash = None;
        action_receipt.created_at = Clock::get()?.unix_timestamp;
        action_receipt.bump = ctx.bumps.action_receipt;

        Ok(())
    }

    pub fn attach_execution_signature(
        ctx: Context<AttachExecutionSignature>,
        _agent_id_hash: [u8; 32],
        _action_id_hash: [u8; 32],
        execution_signature_hash: [u8; 32],
    ) -> Result<()> {
        ctx.accounts.action_receipt.execution_signature_hash = Some(execution_signature_hash);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateUserProfile<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"user", owner.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id_hash: [u8; 32])]
pub struct ConnectAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [b"user", owner.key().as_ref()],
        bump = user_profile.bump,
        has_one = owner
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(
        init,
        payer = owner,
        space = 8 + AgentConnection::INIT_SPACE,
        seeds = [b"connection", owner.key().as_ref(), agent_id_hash.as_ref()],
        bump
    )]
    pub agent_connection: Account<'info, AgentConnection>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id_hash: [u8; 32])]
pub struct UpdatePolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [b"connection", owner.key().as_ref(), agent_id_hash.as_ref()],
        bump = agent_connection.bump,
        has_one = owner
    )]
    pub agent_connection: Account<'info, AgentConnection>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + AgentPolicy::INIT_SPACE,
        seeds = [b"policy", owner.key().as_ref(), agent_id_hash.as_ref()],
        bump
    )]
    pub agent_policy: Account<'info, AgentPolicy>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id_hash: [u8; 32])]
pub struct RevokeAgent<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"connection", owner.key().as_ref(), agent_id_hash.as_ref()],
        bump = agent_connection.bump,
        has_one = owner
    )]
    pub agent_connection: Account<'info, AgentConnection>,
}

#[derive(Accounts)]
#[instruction(agent_id_hash: [u8; 32], action_id_hash: [u8; 32])]
pub struct RecordDecision<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [b"connection", owner.key().as_ref(), agent_id_hash.as_ref()],
        bump = agent_connection.bump,
        has_one = owner
    )]
    pub agent_connection: Account<'info, AgentConnection>,
    #[account(
        init,
        payer = owner,
        space = 8 + ActionReceipt::INIT_SPACE,
        seeds = [
            b"receipt",
            owner.key().as_ref(),
            agent_id_hash.as_ref(),
            action_id_hash.as_ref()
        ],
        bump
    )]
    pub action_receipt: Account<'info, ActionReceipt>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id_hash: [u8; 32], action_id_hash: [u8; 32])]
pub struct AttachExecutionSignature<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"receipt",
            owner.key().as_ref(),
            agent_id_hash.as_ref(),
            action_id_hash.as_ref()
        ],
        bump = action_receipt.bump,
        has_one = owner
    )]
    pub action_receipt: Account<'info, ActionReceipt>,
}

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub owner: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AgentConnection {
    pub owner: Pubkey,
    pub agent_id_hash: [u8; 32],
    pub active: bool,
    pub revoked: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AgentPolicy {
    pub owner: Pubkey,
    pub agent_id_hash: [u8; 32],
    pub max_spend_atomic: u64,
    pub allowed_network_hash: [u8; 32],
    pub allowed_protocols_hash: [u8; 32],
    pub expires_at: i64,
    pub active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ActionReceipt {
    pub owner: Pubkey,
    pub agent_id_hash: [u8; 32],
    pub action_id_hash: [u8; 32],
    pub manifest_hash: [u8; 32],
    pub decision: u8,
    pub policy_result_hash: [u8; 32],
    pub execution_signature_hash: Option<[u8; 32]>,
    pub created_at: i64,
    pub bump: u8,
}

pub enum DecisionCode {
    Approved = 1,
    Rejected = 2,
}

#[error_code]
pub enum SkillGuardError {
    #[msg("Agent connection is not active.")]
    AgentConnectionInactive,
    #[msg("Invalid decision code.")]
    InvalidDecisionCode,
}
