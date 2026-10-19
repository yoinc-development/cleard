package ch.yoinc.cleard.account;

public record AccountResponse(
        String id,
        String name,
        String icon
) {
    public static AccountResponse from(Account account) {
        return new AccountResponse(account.getId().toString(), account.getName(), account.getIcon());
    }
}
